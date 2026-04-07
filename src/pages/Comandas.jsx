import { useState, useRef, useEffect } from 'react';
import { 
  HiOutlineUpload, 
  HiOutlineDownload, 
  HiOutlinePhotograph, 
  HiOutlineDocumentText, 
  HiOutlineRefresh,
  HiOutlineCollection,
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineX
} from 'react-icons/hi';
import JsBarcode from 'jsbarcode';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';

export default function Comandas() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('gerar');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [template, setTemplate] = useState(null);
  const [data, setData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [pageWidth, setPageWidth] = useState(6.5);
  const [pageHeight, setPageHeight] = useState(9.5);
  const canvasRef = useRef(null);
  
  // Settings for fine-tuning in Percentages (%)
  const [settings, setSettings] = useState({
    qrSize: 50,
    qrX: 50,
    qrY: 42,
    textX: 50,
    textY: 80,
    fontSize: 6,
    textColor: '#000000',
    drawWhiteBox: true,
    boxWidth: 62,
    boxX: 50,
    boxHeight: 50,
    boxY: 38,
    boxRadius: 5
  });

  const [exportOnlyQR, setExportOnlyQR] = useState(false);
  const [codeType, setCodeType] = useState('qr'); // 'qr' or 'barcode'
  const [dataSource, setDataSource] = useState('link'); // 'link' or 'controle'
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'zip'

  const [previewDataUrl, setPreviewDataUrl] = useState(null);

  useEffect(() => {
    if (activeTab === 'historico') {
      fetchHistory();
    }
  }, [activeTab, user]);

  const fetchHistory = async () => {
    if (!hasSupabaseConfig || !user) return;
    setLoadingHistory(true);
    try {
      const { data: historyData, error } = await supabase
        .from('comandas_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code !== '42P01') console.error(error); // Ignores "relation does not exist" gracefully
      } else {
        setHistory(historyData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async (id, fileUrl) => {
    if (!confirm('Tem certeza que deseja apagar este histórico?')) return;
    try {
      // 1. Delete from DB
      await supabase.from('comandas_history').delete().eq('id', id);
      
      // 2. Extract path from url and try deleting from storage
      try {
        const urlParts = fileUrl.split('/storage/v1/object/public/comandas/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          await supabase.storage.from('comandas').remove([path]);
        }
      } catch (e) {
        console.error('Failed to remove from storage, maybe already gone.', e);
      }
      
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success('Histórico apagado.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar histórico.');
    }
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setTemplate(dataUrl);
      
      // Auto-adjust dimensions based on image aspect ratio
      const img = new Image();
      img.onload = () => {
        const ratio = img.height / img.width;
        // Keep current width but adjust height to match aspect ratio
        setPageHeight(Number((pageWidth * ratio).toFixed(2)));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read as array of arrays
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const validData = [];
        // Loop starts at row 3 (which is index 3 in 0-based array, meaning row 4 in Excel)
        for (let i = 3; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;
          
          const codigo = row[0]; // Coluna A (Ex: 1, 2, 3)
          const controle = row[1]; // Coluna B (Ex: c1, c2, c3)
          const link = row[2];   // Coluna C
          
          // Re-format controle to 4 digits (e.g., c001, c048)
          let formattedControle = '';
          if (controle) {
            const numeroControle = String(controle).toLowerCase().replace('c', '');
            if (!isNaN(numeroControle) && numeroControle !== '') {
              formattedControle = 'c' + String(numeroControle).padStart(3, '0');
            } else {
              formattedControle = controle;
            }
          }

          if ((link && String(link).trim() !== '') || (formattedControle && String(formattedControle).trim() !== '')) {
            const numero = codigo !== undefined && codigo !== null 
              ? String(codigo).padStart(3, '0') 
              : String(validData.length + 1).padStart(3, '0');
              
            validData.push({ numero, link, controle: formattedControle });
          }
        }
        
        if (validData.length > 0) {
          setData(validData);
          toast.success(`${validData.length} comandas encontradas!`);
        } else {
          toast.error("Nenhum dado encontrado a partir da linha 4.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao ler arquivo Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper to draw a single card
  const drawCard = async (ctx, canvasWidth, canvasHeight, itemData, currentSettings) => {
    // Calculo de porcentagens para Pixels absolutos usando o tamanho da página
    const qrPx = (currentSettings.qrSize / 100) * canvasWidth;
    const fontPx = (currentSettings.fontSize / 100) * canvasHeight;
    const boxWPx = (currentSettings.boxWidth / 100) * canvasWidth;
    const boxHPx = (currentSettings.boxHeight / 100) * canvasHeight;
    const boxXPx = (currentSettings.boxX / 100) * canvasWidth - (boxWPx / 2);
    const boxYPx = (currentSettings.boxY / 100) * canvasHeight - (boxHPx / 2);
    const boxRadiusPx = (currentSettings.boxRadius / 100) * canvasWidth;

    // 1. Draw Template (Skip if exportOnlyQR is true)
    if (template && !exportOnlyQR) {
      const img = new Image();
      img.src = template;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          resolve();
        };
      });
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. Draw White Box (Skip if exportOnlyQR is true)
    if (currentSettings.drawWhiteBox && !exportOnlyQR) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(boxXPx + boxRadiusPx, boxYPx);
      ctx.lineTo(boxXPx + boxWPx - boxRadiusPx, boxYPx);
      ctx.quadraticCurveTo(boxXPx + boxWPx, boxYPx, boxXPx + boxWPx, boxYPx + boxRadiusPx);
      ctx.lineTo(boxXPx + boxWPx, boxYPx + boxHPx - boxRadiusPx);
      ctx.quadraticCurveTo(boxXPx + boxWPx, boxYPx + boxHPx, boxXPx + boxWPx - boxRadiusPx, boxYPx + boxHPx);
      ctx.lineTo(boxXPx + boxRadiusPx, boxYPx + boxHPx);
      ctx.quadraticCurveTo(boxXPx, boxYPx + boxHPx, boxXPx, boxYPx + boxHPx - boxRadiusPx);
      ctx.lineTo(boxXPx, boxYPx + boxRadiusPx);
      ctx.quadraticCurveTo(boxXPx, boxYPx, boxXPx + boxRadiusPx, boxYPx);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Draw QR Code or Barcode
    const content = dataSource === 'link' ? itemData?.link : itemData?.controle;
    if (itemData && content) {
      try {
        if (codeType === 'qr') {
          const qrDataUrl = await QRCode.toDataURL(content, {
            width: Math.round(qrPx),
            margin: 0,
            errorCorrectionLevel: 'H'
          });
          
          const qrImg = new Image();
          qrImg.src = qrDataUrl;
          await new Promise((resolve) => {
            qrImg.onload = () => {
              const qrXPx = (currentSettings.qrX / 100) * canvasWidth - (qrPx / 2);
              const qrYPx = (currentSettings.qrY / 100) * canvasHeight - (qrPx / 2);
              ctx.drawImage(qrImg, qrXPx, qrYPx, qrPx, qrPx);
              resolve();
            };
          });
        } else {
          // CODE128 Barcode
          const barcodeCanvas = document.createElement('canvas');
          JsBarcode(barcodeCanvas, content, {
            format: "CODE128",
            displayValue: false,
            margin: 0,
            background: "transparent"
          });
          
          const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
          const barcodeImg = new Image();
          barcodeImg.src = barcodeDataUrl;
          await new Promise((resolve) => {
            barcodeImg.onload = () => {
              const qrXPx = (currentSettings.qrX / 100) * canvasWidth - (qrPx / 2);
              const bWidth = qrPx;
              const bHeight = qrPx * 0.4; // common ratio
              const qrYPx = (currentSettings.qrY / 100) * canvasHeight - (bHeight / 2);
              ctx.drawImage(barcodeImg, qrXPx, qrYPx, bWidth, bHeight);
              resolve();
            };
          });
        }
      } catch (err) {
        console.error("Erro ao gerar Código:", err);
      }
    }

    // 4. Draw Text (Always drawn now, even if exportOnlyQR is true)
    if (itemData && itemData.numero) {
      ctx.fillStyle = currentSettings.textColor;
      ctx.font = `bold ${fontPx}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textXPx = (currentSettings.textX / 100) * canvasWidth;
      const textYPx = (currentSettings.textY / 100) * canvasHeight;
      ctx.fillText(itemData.numero, textXPx, textYPx);
    }
  };

  useEffect(() => {
    const updatePreview = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = pageWidth * 100;
      canvas.height = pageHeight * 100;
      
      const sampleItem = data.length > 0 ? data[0] : { numero: '001', link: 'https://exemplo.com', controle: 'c001' };
      
      await drawCard(ctx, canvas.width, canvas.height, sampleItem, settings);
      setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    updatePreview();
  }, [template, data, settings, pageWidth, pageHeight, exportOnlyQR, codeType, dataSource]);

  const handlePreGenerate = () => {
    if (!template && !exportOnlyQR) {
      toast.error('Por favor, faça o upload da imagem de fundo ou marque para exportar apenas o código.');
      return;
    }
    if (data.length === 0) {
      toast.error('Por favor, faça o upload da planilha com os dados.');
      return;
    }
    setDocName('');
    setIsModalOpen(true);
  };

  const handleGeneratePDF = async (e) => {
    if (e) e.preventDefault();
    if (!docName.trim()) {
      toast.error('Por favor, insira um nome para o lote.');
      return;
    }
    
    setIsModalOpen(false);
    setIsGenerating(true);
    const loadingToast = toast.loading(`Gerando ${exportFormat.toUpperCase()} aguarde...`);

    try {
      const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
      
      if (exportFormat === 'pdf') {
        const pdf = new jsPDF({
          orientation,
          unit: 'cm',
          format: [pageWidth, pageHeight]
        });

        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = pageWidth * 100;
        hiddenCanvas.height = pageHeight * 100;
        const ctx = hiddenCanvas.getContext('2d');

        for (let i = 0; i < data.length; i++) {
          if (i > 0) pdf.addPage([pageWidth, pageHeight], orientation);
          ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
          
          await drawCard(ctx, hiddenCanvas.width, hiddenCanvas.height, data[i], settings);
          
          const cardDataUrl = hiddenCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(cardDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
          
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        const safeFilename = (docName.replace(/[^a-z0-9]/gi, '_').toLowerCase()) || 'lote';
        const pdfBlob = pdf.output('blob');
        saveAs(pdfBlob, `comandas_${safeFilename}.pdf`);

        // Attempt to save to Supabase
        if (hasSupabaseConfig && user) {
          toast.loading('Salvando no histórico...', { id: loadingToast });
          const storagePath = `${user.id}/${Date.now()}_${safeFilename}.pdf`;

          const { error: uploadError } = await supabase.storage.from('comandas').upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: false
          });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            toast.error('PDF baixado, mas não salvo no storage do Supabase.', { id: loadingToast, duration: 6000 });
          } else {
            const { data: { publicUrl } } = supabase.storage.from('comandas').getPublicUrl(storagePath);
            await supabase.from('comandas_history').insert({
              user_id: user.id,
              name: docName,
              file_url: publicUrl
            });
            toast.success('PDF gerado e salvo com sucesso!', { id: loadingToast });
          }
        } else {
          toast.success('PDF gerado com sucesso!', { id: loadingToast });
        }

      } else {
        // Handle ZIP (.png)
        const zip = new JSZip();
        
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = pageWidth * 100;
        hiddenCanvas.height = pageHeight * 100;
        const ctx = hiddenCanvas.getContext('2d');

        for (let i = 0; i < data.length; i++) {
          ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
          await drawCard(ctx, hiddenCanvas.width, hiddenCanvas.height, data[i], settings);
          
          const cardDataUrl = hiddenCanvas.toDataURL('image/png');
          const base64Data = cardDataUrl.split(',')[1];
          const filename = `comanda_${data[i].numero || (i+1)}.png`;
          zip.file(filename, base64Data, { base64: true });
          
          if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 10));
        }

        const safeFilename = (docName.replace(/[^a-z0-9]/gi, '_').toLowerCase()) || 'lote';
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `comandas_${safeFilename}.zip`);
        toast.success('Arquivo ZIP gerado com sucesso!', { id: loadingToast });
      }

    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar exportação', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleAutoCenter = () => {
    // Calcula a altura real do código em relação à altura total do cartão (%)
    const cardW = pageWidth;
    const cardH = pageHeight;
    
    const codeH_in_cm = codeType === 'qr' 
      ? (settings.qrSize/100 * cardW) 
      : (settings.qrSize/100 * cardW * 0.4);
    const codeH_pct = (codeH_in_cm / cardH) * 100;
    
    // Altura do texto (%)
    const textH_pct = settings.fontSize;
    
    // Espaçamento entre os elementos (8% da altura do cartão)
    const gap_pct = 8;
    
    // Altura total do bloco (Código + Gap + Texto)
    const blockH_pct = codeH_pct + gap_pct + textH_pct;
    
    // Margem superior para centralizar o bloco inteiro no meio do cartão
    const topMargin_pct = (100 - blockH_pct) / 2;
    
    setSettings(prev => ({
      ...prev,
      qrX: 50,
      textX: 50,
      qrY: topMargin_pct + (codeH_pct / 2),
      textY: topMargin_pct + codeH_pct + gap_pct + (textH_pct / 2)
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Comandas App</h1>
          <p className="text-dark-300 mt-1">Crie PDFs de comandas e consulte seu histórico gerado previamente.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-800/80 p-1.5 rounded-xl border border-dark-600/50 w-full md:w-fit">
        <button
          onClick={() => setActiveTab('gerar')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'gerar' 
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' 
              : 'text-dark-300 hover:text-white hover:bg-dark-700'
          }`}
        >
          <HiOutlineViewGrid className="w-5 h-5" />
          Gerar Comandas
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'historico' 
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' 
              : 'text-dark-300 hover:text-white hover:bg-dark-700'
          }`}
        >
          <HiOutlineViewList className="w-5 h-5" />
          Histórico
        </button>
      </div>

      {activeTab === 'gerar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Section */}
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-white mb-4">1. Arquivos Base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Template Upload */}
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-dark-600 rounded-xl hover:border-brand-500 hover:bg-dark-700/50 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HiOutlinePhotograph className="w-6 h-6 text-brand-400" />
                  </div>
                  <span className="text-sm font-medium text-white mb-1">Upload Fundo (Imagem)</span>
                  <span className="text-xs text-dark-400 text-center">JPG ou PNG sem o QR Code e número</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleTemplateUpload} />
                  {template && <span className="mt-2 text-xs text-brand-400 font-medium">✓ Imagem carregada</span>}
                </label>

                {/* Excel Upload */}
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-dark-600 rounded-xl hover:border-brand-500 hover:bg-dark-700/50 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HiOutlineDocumentText className="w-6 h-6 text-brand-400" />
                  </div>
                  <span className="text-sm font-medium text-white mb-1">Upload Dados (Excel)</span>
                  <span className="text-xs text-dark-400 text-center">dados.xlsx (A: Código, C: Link)</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
                  {data.length > 0 && <span className="mt-2 text-xs text-brand-400 font-medium">✓ {data.length} registros</span>}
                </label>
              </div>
            </div>

            {/* Dimensions Section */}
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">2. Dimensões da Página</h2>
                <button 
                  onClick={() => { setPageWidth(4); setPageHeight(3); }}
                  className="px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-xs font-medium transition-colors"
                >
                  Tamanho Padrão (4x3cm)
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Largura (cm)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={pageWidth} 
                    onChange={(e) => setPageWidth(Number(e.target.value) || 6.5)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-1.5">Altura (cm)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={pageHeight} 
                    onChange={(e) => setPageHeight(Number(e.target.value) || 9.5)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">3. Ajuste de Posições</h2>
                <button 
                  onClick={handleAutoCenter}
                  className="px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-xs font-medium transition-colors"
                >
                  Auto-Centralizar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Tamanho do QR Code</span>
                    <span className="text-brand-400">{settings.qrSize}%</span>
                  </label>
                  <input type="range" min="10" max="100" value={settings.qrSize} onChange={(e) => handleSettingChange('qrSize', e.target.value)} className="w-full accent-brand-500" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Posição Vertical QR Code (Y)</span>
                    <span className="text-brand-400">{settings.qrY}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={settings.qrY} onChange={(e) => handleSettingChange('qrY', e.target.value)} className="w-full accent-brand-500" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Posição Horizontal QR Code (X)</span>
                    <span className="text-brand-400">{settings.qrX}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={settings.qrX} onChange={(e) => handleSettingChange('qrX', e.target.value)} className="w-full accent-brand-500" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Posição Horizontal Texto (X)</span>
                    <span className="text-brand-400">{settings.textX}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={settings.textX} onChange={(e) => handleSettingChange('textX', e.target.value)} className="w-full accent-brand-500" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Tamanho do Texto</span>
                    <span className="text-brand-400">{settings.fontSize}%</span>
                  </label>
                  <input type="range" min="1" max="30" value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', e.target.value)} className="w-full accent-brand-500" />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                    <span>Posição Vertical Texto (Y)</span>
                    <span className="text-brand-400">{settings.textY}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={settings.textY} onChange={(e) => handleSettingChange('textY', e.target.value)} className="w-full accent-brand-500" />
                </div>

              </div>

              <div className="mt-6 pt-6 border-t border-dark-600/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.drawWhiteBox} 
                    onChange={(e) => setSettings(p => ({...p, drawWhiteBox: e.target.checked}))}
                    className="w-5 h-5 rounded border-dark-500 bg-dark-700 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-800"
                  />
                  <span className="text-sm font-medium text-white">Desenhar Fundo Branco Arredondado (Atrás do QR/Texto)</span>
                </label>

                {settings.drawWhiteBox && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                        <span>Largura da Caixa</span>
                        <span className="text-brand-400">{settings.boxWidth}%</span>
                      </label>
                      <input type="range" min="10" max="100" value={settings.boxWidth} onChange={(e) => handleSettingChange('boxWidth', e.target.value)} className="w-full accent-brand-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                        <span>Posição Horizontal Caixa (X)</span>
                        <span className="text-brand-400">{settings.boxX}%</span>
                      </label>
                      <input type="range" min="0" max="100" value={settings.boxX} onChange={(e) => handleSettingChange('boxX', e.target.value)} className="w-full accent-brand-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                        <span>Altura da Caixa</span>
                        <span className="text-brand-400">{settings.boxHeight}%</span>
                      </label>
                      <input type="range" min="10" max="100" value={settings.boxHeight} onChange={(e) => handleSettingChange('boxHeight', e.target.value)} className="w-full accent-brand-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                        <span>Posição Vertical Caixa (Y)</span>
                        <span className="text-brand-400">{settings.boxY}%</span>
                      </label>
                      <input type="range" min="0" max="100" value={settings.boxY} onChange={(e) => handleSettingChange('boxY', e.target.value)} className="w-full accent-brand-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                        <span>Arredondamento Caixa</span>
                        <span className="text-brand-400">{settings.boxRadius}%</span>
                      </label>
                      <input type="range" min="0" max="50" value={settings.boxRadius} onChange={(e) => handleSettingChange('boxRadius', e.target.value)} className="w-full accent-brand-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Novas Configurações */}
              <div className="mt-8 pt-8 border-t border-dark-600/50 space-y-6">
                <h3 className="text-md font-semibold text-white">Opções Adicionais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Only QR */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-200">Exportação</label>
                    <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-600">
                      <button 
                        onClick={() => setExportOnlyQR(false)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${!exportOnlyQR ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        Comanda Completa
                      </button>
                      <button 
                        onClick={() => setExportOnlyQR(true)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${exportOnlyQR ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        Apenas Código
                      </button>
                    </div>
                  </div>

                  {/* Code Type */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-200">Tipo de Código</label>
                    <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-600">
                      <button 
                        onClick={() => setCodeType('qr')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${codeType === 'qr' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        QR Code
                      </button>
                      <button 
                        onClick={() => setCodeType('barcode')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${codeType === 'barcode' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        Código de Barra
                      </button>
                    </div>
                  </div>

                  {/* Data Source */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-200">Origem do Dado</label>
                    <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-600">
                      <button 
                        onClick={() => setDataSource('link')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${dataSource === 'link' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        Link Cardápio
                      </button>
                      <button 
                        onClick={() => setDataSource('controle')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${dataSource === 'controle' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        Controle
                      </button>
                    </div>
                  </div>

                  {/* Export Format */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-200">Formato de Arquivo</label>
                    <div className="flex bg-dark-900 rounded-lg p-1 border border-dark-600">
                      <button 
                        onClick={() => setExportFormat('pdf')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${exportFormat === 'pdf' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        PDF (.pdf)
                      </button>
                      <button 
                        onClick={() => setExportFormat('zip')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded ${exportFormat === 'zip' ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white'}`}
                      >
                        ZIP (.png)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handlePreGenerate}
                disabled={isGenerating || (!template && !exportOnlyQR) || data.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <HiOutlineRefresh className="w-5 h-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <HiOutlineDownload className="w-5 h-5" />
                    Gerar {exportFormat === 'pdf' ? 'PDF' : 'ZIP'} ({pageWidth} x {pageHeight} cm)
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl p-6 shadow-xl sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
              <div className="bg-dark-900 rounded-xl p-4 flex items-center justify-center border border-dark-600/50">
                {/* Hidden canvas used for generating the preview */}
                <canvas ref={canvasRef} className="hidden" />
                
                {previewDataUrl ? (
                  <div className="relative group">
                    <img 
                      src={previewDataUrl} 
                      alt="Preview Comanda" 
                      className="w-full h-auto max-w-[280px] rounded shadow-lg mx-auto"
                    />
                    <div className="absolute inset-0 border-2 border-brand-500/50 rounded pointer-events-none" />
                  </div>
                ) : (
                  <div style={{ aspectRatio: `${pageWidth}/${pageHeight}` }} className="w-full max-w-[280px] border-2 border-dashed border-dark-600 rounded flex flex-col items-center justify-center text-dark-400 p-6 text-center">
                    <HiOutlinePhotograph className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Faça o upload da imagem e planilha para ver o preview</span>
                  </div>
                )}
              </div>
              <div className="mt-4 text-xs text-dark-400 text-center space-y-1">
                <p>Preview da primeira comanda</p>
                <p className="opacity-70">Dimensões finais: {pageWidth}cm x {pageHeight}cm</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-xl p-6 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Histórico de Comandas Geradas</h2>
            <button 
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="p-2 text-dark-300 hover:text-white bg-dark-700/50 hover:bg-dark-600/50 rounded-lg transition-colors"
            >
              <HiOutlineRefresh className={`w-5 h-5 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {!hasSupabaseConfig && (
             <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
               <p className="text-orange-400 text-sm">Supabase não configurado. O histórico não estará disponível.</p>
             </div>
          )}

          {loadingHistory ? (
             <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <HiOutlineCollection className="w-16 h-16 text-dark-500 mb-4" />
              <h3 className="text-dark-200 font-medium">Nenhum PDF no histórico ainda.</h3>
              <p className="text-dark-400 text-sm mt-1">Gere sua primeira comanda para vê-la aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-dark-700/30 border border-dark-600/50 p-4 rounded-xl flex flex-col justify-between group hover:border-brand-500/50 transition-colors">
                  <div>
                    <h3 className="text-white font-medium mb-1 truncate" title={item.name}>{item.name}</h3>
                    <p className="text-xs text-dark-400 mb-4">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', { 
                         day: '2-digit', month: 'short', year: 'numeric',
                         hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={item.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <HiOutlineExternalLink className="w-4 h-4" />
                      Visualizar PDF
                    </a>
                    <button
                      onClick={() => handleDeleteHistory(item.id, item.file_url)}
                      className="p-2 text-dark-400 hover:text-red-400 bg-dark-800 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                      title="Apagar do Histórico"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Nomear o Lote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">
              Nome do Lote
            </h3>
            <p className="text-dark-300 text-sm mb-6">
              Dê um nome para identificar este pacote de comandas no sistema. (ex: Evento Rock, Sábado)
            </p>
            <form onSubmit={handleGeneratePDF}>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Digite o nome..."
                className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all mb-6"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-dark-200 hover:text-white hover:bg-dark-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-medium bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20 transition-all"
                >
                  Confirmar e Gerar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
