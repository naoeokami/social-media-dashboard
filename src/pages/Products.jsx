import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineShoppingBag, 
  HiOutlineTag,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineFilter
} from 'react-icons/hi';
import { toast } from 'react-hot-toast';

export default function Products() {
  const { products, segments, addProduct, deleteProduct, addSegment, deleteSegment } = useApp();
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newSegment, setNewSegment] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    segments: []
  });

  const handleAddSegment = (e) => {
    e.preventDefault();
    if (!newSegment.trim()) return;
    addSegment(newSegment.trim());
    setNewSegment('');
    toast.success('Segmento adicionado!');
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || newProduct.segments.length === 0) {
      toast.error('Preencha pelo menos o nome e selecione um segmento.');
      return;
    }
    addProduct({
      name: newProduct.name,
      description: newProduct.description,
      segment: newProduct.segments.join(', ')
    });
    setNewProduct({ name: '', description: '', segments: [] });
    setIsProductModalOpen(false);
    toast.success('Produto registrado!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.segment && p.segment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
      {/* Mini Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Produtos e Segmentos
          </h1>
          <p className="text-dark-400 text-sm mt-1">Gerencie seu catálogo de produtos e nichos.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600/50 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500/50 w-full md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsSegmentModalOpen(true)}
            className="p-2.5 bg-dark-800 border border-dark-600/50 rounded-xl text-dark-300 hover:text-white hover:border-dark-500 transition-all shadow-lg"
            title="Gerenciar Segmentos"
          >
            <HiOutlineTag className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition-all"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-dark-800/30 rounded-3xl border border-dark-600/30">
          <HiOutlineShoppingBag className="w-16 h-16 text-dark-600 mb-4" />
          <h3 className="text-dark-200 font-medium">Nenhum produto encontrado</h3>
          <p className="text-dark-500 text-sm mt-1">
            {searchTerm ? 'Tente outro termo de busca.' : 'Comece adicionando seu primeiro produto.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(prod => {
            const allSegments = (prod.segments || (prod.segment ? prod.segment.split(',').map(s => s.trim()) : []));
            const visibleSegments = allSegments.slice(0, 2);
            const remainingCount = allSegments.length - visibleSegments.length;

            return (
              <div key={prod.id} className="bg-dark-800/50 backdrop-blur-xl border border-dark-600/50 rounded-2xl p-5 shadow-xl hover:border-brand-500/30 transition-all group relative flex flex-col justify-between overflow-hidden min-h-[140px]">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                  <button 
                    onClick={() => deleteProduct(prod.id)}
                    className="p-2 text-dark-400 hover:text-red-400 bg-dark-900/50 rounded-lg backdrop-blur-sm"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2 group-hover:text-brand-300 transition-colors pr-6">
                    {prod.name}
                  </h4>
                  {prod.description && (
                    <p className="text-dark-400 text-[11px] line-clamp-2 leading-tight mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                      {prod.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {visibleSegments.map((seg, i) => (
                    <span key={i} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-dark-700/50 text-dark-300 rounded-md border border-dark-600/30">
                      {seg}
                    </span>
                  ))}
                  {remainingCount > 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-md border border-brand-500/10">
                       e +{remainingCount} segmentos
                    </span>
                  )}
                  {allSegments.length === 0 && (
                    <span className="text-[9px] font-bold text-dark-500 italic">Sem segmentos</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVO PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up relative">
            <button 
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Novo Produto</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Nome do Produto</label>
                <input 
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ex: Consultoria Express"
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Segmentos / Categorias</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {segments.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setNewProduct(prev => ({
                          ...prev,
                          segments: prev.segments?.includes(s.name)
                            ? prev.segments.filter(name => name !== s.name)
                            : [...(prev.segments || []), s.name]
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        newProduct.segments?.includes(s.name)
                          ? 'bg-brand-500/20 text-brand-400 border-brand-500/50'
                          : 'bg-dark-900 text-dark-400 border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                  {segments.length === 0 && (
                    <p className="text-xs text-dark-500 italic">Nenhum segmento criado ainda.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Descrição</label>
                <textarea 
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Breve descrição do produto..."
                  rows={3}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-2.5 text-dark-300 hover:text-white font-medium transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/25"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERENCIAR SEGMENTOS */}
      {isSegmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setIsSegmentModalOpen(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Segmentos</h3>
            <p className="text-dark-400 text-sm mb-6">Gerencie os nichos para seus produtos.</p>
            
            <form onSubmit={handleAddSegment} className="flex gap-2 mb-6">
              <input 
                type="text"
                value={newSegment}
                onChange={e => setNewSegment(e.target.value)}
                placeholder="Novo segmento..."
                className="flex-1 bg-dark-900 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500"
              />
              <button 
                type="submit"
                className="p-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl shadow-lg shadow-brand-500/25 transition-all"
              >
                <HiOutlinePlus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-dark-600">
              {segments.length === 0 ? (
                <p className="text-center py-10 text-dark-500 italic text-sm">Nenhum segmento ainda.</p>
              ) : (
                segments.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-dark-900/50 border border-dark-600/30 rounded-xl group">
                    <span className="text-dark-200 text-sm">{s.name}</span>
                    <button 
                      onClick={() => deleteSegment(s.id)}
                      className="p-1.5 text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsSegmentModalOpen(false)}
                className="px-6 py-2 bg-dark-900 text-white rounded-xl text-sm font-medium border border-dark-600/50 hover:bg-dark-700 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
