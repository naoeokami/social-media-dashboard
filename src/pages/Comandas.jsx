import { useState, useRef, useEffect } from 'react';
import { HiOutlineUpload, HiOutlineDownload, HiOutlinePhotograph, HiOutlineDocumentText, HiOutlineRefresh } from 'react-icons/hi';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export default function Comandas() {
  const [template, setTemplate] = useState(null);
  const [data, setData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);
  
  // Settings for fine-tuning
  const [settings, setSettings] = useState({
    qrSize: 320,
    qrY: 400,
    textY: 760,
    fontSize: 54,
    textColor: '#000000',
    drawWhiteBox: true,
    boxWidth: 400,
    boxHeight: 480,
    boxY: 360,
    boxRadius: 30
  });

  const [previewDataUrl, setPreviewDataUrl] = useState(null);

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setTemplate(evt.target.result);
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
        // according to "dados.xlsx com as informações dos códigos da comanda" starting from C4
        for (let i = 3; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;
          
          const codigo = row[0]; // Coluna A
          const link = row[2];   // Coluna C
          
          if (link && String(link).trim() !== '') {
            // pad with zeroes, e.g. 1 -> "001"
            const numero = codigo !== undefined && codigo !== null 
              ? String(codigo).padStart(3, '0') 
              : String(validData.length + 1).padStart(3, '0');
              
            validData.push({ numero, link });
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

  // Helper to draw a single card on a given canvas context
  const drawCard = async (ctx, canvasWidth, canvasHeight, itemData, currentSettings) => {
    // 1. Draw Template
    if (template) {
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

    // 2. Draw White Box (optional)
    if (currentSettings.drawWhiteBox) {
      const { boxWidth, boxHeight, boxY, boxRadius } = currentSettings;
      const boxX = (canvasWidth - boxWidth) / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(boxX + boxRadius, boxY);
      ctx.lineTo(boxX + boxWidth - boxRadius, boxY);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxRadius);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - boxRadius);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - boxRadius, boxY + boxHeight);
      ctx.lineTo(boxX + boxRadius, boxY + boxHeight);
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - boxRadius);
      ctx.lineTo(boxX, boxY + boxRadius);
      ctx.quadraticCurveTo(boxX, boxY, boxX + boxRadius, boxY);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Draw QR Code
    if (itemData && itemData.link) {
      try {
        const qrDataUrl = await QRCode.toDataURL(itemData.link, {
          width: currentSettings.qrSize,
          margin: 0,
          errorCorrectionLevel: 'H'
        });
        
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = () => {
            const qrX = (canvasWidth - currentSettings.qrSize) / 2;
            ctx.drawImage(qrImg, qrX, currentSettings.qrY, currentSettings.qrSize, currentSettings.qrSize);
            resolve();
          };
        });
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    }

    // 4. Draw Text
    if (itemData && itemData.numero) {
      ctx.fillStyle = currentSettings.textColor;
      ctx.font = `bold ${currentSettings.fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(itemData.numero, canvasWidth / 2, currentSettings.textY);
    }
  };

  // Update preview whenever settings, template or data changes
  useEffect(() => {
    const updatePreview = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Using 650x950 as base resolution (aspect ratio matches 6.5x9.5 cm)
      canvas.width = 650;
      canvas.height = 950;
      
      const sampleItem = data.length > 0 ? data[0] : { numero: '001', link: 'https://exemplo.com' };
      
      await drawCard(ctx, canvas.width, canvas.height, sampleItem, settings);
      setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    updatePreview();
  }, [template, data, settings]);

  const handleGeneratePDF = async () => {
    if (!template) {
      toast.error('Por favor, faça o upload da imagem de fundo.');
      return;
    }
    if (data.length === 0) {
      toast.error('Por favor, faça o upload da planilha com os dados.');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Gerando PDF aguarde...');

    try {
      // jsPDF setup - 6.5cm x 9.5cm portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'cm',
        format: [6.5, 9.5]
      });

      // We'll use a hidden canvas to draw each card
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = 650;
      hiddenCanvas.height = 950;
      const ctx = hiddenCanvas.getContext('2d');

      for (let i = 0; i < data.length; i++) {
        if (i > 0) pdf.addPage();

        // Clear canvas
        ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        
        // Draw card onto canvas
        await drawCard(ctx, hiddenCanvas.width, hiddenCanvas.height, data[i], settings);
        
        // Add to PDF Document as an Image
        const cardDataUrl = hiddenCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(cardDataUrl, 'JPEG', 0, 0, 6.5, 9.5);
        
        // Minimal delay to prevent freezing the UI on large lists
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      pdf.save('comandas.pdf');
      toast.success('PDF gerado com sucesso!', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: Number(value) }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gerador de Comandas</h1>
          <p className="text-dark-300 mt-1">Crie PDFs de comandas automatizados a partir de uma planilha.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload Section */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-2xl p-6 shadow-xl">
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

          {/* Settings Section */}
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">2. Ajuste de Posições</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                  <span>Tamanho do QR Code</span>
                  <span className="text-brand-400">{settings.qrSize}px</span>
                </label>
                <input type="range" min="100" max="600" value={settings.qrSize} onChange={(e) => handleSettingChange('qrSize', e.target.value)} className="w-full accent-brand-500" />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                  <span>Posição Vertical QR Code (Y)</span>
                  <span className="text-brand-400">{settings.qrY}px</span>
                </label>
                <input type="range" min="0" max="800" value={settings.qrY} onChange={(e) => handleSettingChange('qrY', e.target.value)} className="w-full accent-brand-500" />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                  <span>Tamanho do Texto</span>
                  <span className="text-brand-400">{settings.fontSize}px</span>
                </label>
                <input type="range" min="20" max="150" value={settings.fontSize} onChange={(e) => handleSettingChange('fontSize', e.target.value)} className="w-full accent-brand-500" />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                  <span>Posição Vertical Texto (Y)</span>
                  <span className="text-brand-400">{settings.textY}px</span>
                </label>
                <input type="range" min="0" max="900" value={settings.textY} onChange={(e) => handleSettingChange('textY', e.target.value)} className="w-full accent-brand-500" />
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
                      <span className="text-brand-400">{settings.boxWidth}px</span>
                    </label>
                    <input type="range" min="200" max="600" value={settings.boxWidth} onChange={(e) => handleSettingChange('boxWidth', e.target.value)} className="w-full accent-brand-500" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                      <span>Altura da Caixa</span>
                      <span className="text-brand-400">{settings.boxHeight}px</span>
                    </label>
                    <input type="range" min="200" max="800" value={settings.boxHeight} onChange={(e) => handleSettingChange('boxHeight', e.target.value)} className="w-full accent-brand-500" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                      <span>Posição Vertical Caixa (Y)</span>
                      <span className="text-brand-400">{settings.boxY}px</span>
                    </label>
                    <input type="range" min="0" max="800" value={settings.boxY} onChange={(e) => handleSettingChange('boxY', e.target.value)} className="w-full accent-brand-500" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-medium text-dark-200">
                      <span>Arredondamento Caixa</span>
                      <span className="text-brand-400">{settings.boxRadius}px</span>
                    </label>
                    <input type="range" min="0" max="100" value={settings.boxRadius} onChange={(e) => handleSettingChange('boxRadius', e.target.value)} className="w-full accent-brand-500" />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating || !template || data.length === 0}
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
                  Gerar PDF (6,5 x 9,5 cm)
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-2xl p-6 shadow-xl sticky top-6">
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
                <div className="aspect-[6.5/9.5] w-full max-w-[280px] border-2 border-dashed border-dark-600 rounded flex flex-col items-center justify-center text-dark-400 p-6 text-center">
                  <HiOutlinePhotograph className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">Faça o upload da imagem e planilha para ver o preview</span>
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-dark-400 text-center space-y-1">
              <p>Preview da primeira comanda</p>
              <p className="opacity-70">Dimensões finais: 6,5cm x 9,5cm</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
