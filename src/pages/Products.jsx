import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineShoppingBag, HiOutlineTag } from 'react-icons/hi';
import { toast } from 'react-hot-toast';

export default function Products() {
  const { products, segments, addProduct, deleteProduct, addSegment, deleteSegment } = useApp();
  
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
    toast.success('Produto registrado!');
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <HiOutlineShoppingBag className="w-8 h-8 text-brand-500" />
          Produtos e Segmentos
        </h1>
        <p className="text-dark-300 mt-2">
          Gerencie os nichos de mercado (segmentos) e registre os produtos que serão divulgados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gestão de Segmentos */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <HiOutlineTag className="text-brand-400" />
              Segmentos
            </h2>
            
            <form onSubmit={handleAddSegment} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={newSegment}
                onChange={e => setNewSegment(e.target.value)}
                placeholder="Ex: Food Service..."
                className="flex-1 px-4 py-2.5 bg-dark-700/50 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 rounded-xl font-medium transition-all flex items-center justify-center"
              >
                <HiOutlinePlus className="w-5 h-5 flex-shrink-0" />
              </button>
            </form>

            <div className="space-y-2">
              {segments.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-4">Nenhum segmento adicionado.</p>
              ) : (
                segments.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-dark-700/30 border border-dark-600/30 rounded-xl hover:border-brand-500/30 transition-all group/seg">
                    <span className="text-white text-sm font-medium leading-tight">{s.name}</span>
                    <button onClick={() => deleteSegment(s.id)} className="text-dark-400 hover:text-red-400 p-1 opacity-50 group-hover/seg:opacity-100 transition-opacity">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Gestão de Produtos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-800 border border-dark-600/50 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <HiOutlineShoppingBag className="text-brand-400" />
              Registrar Produto
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4 mb-8 p-5 bg-dark-700/30 border border-dark-600/50 rounded-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Ex: Hambúrguer Artesanal"
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-2">Segmentos (Selecione um ou mais) *</label>
                  <div className="flex flex-wrap gap-2">
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
                            : 'bg-dark-800/50 text-dark-300 border-dark-600/50 hover:border-dark-500 hover:text-white'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                    {segments.length === 0 && (
                      <p className="text-xs text-dark-400">Adicione segmentos primeiro.</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Descrição</label>
                <textarea
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Detalhes para usar no marketing..."
                  rows={2}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2 gradient-brand rounded-lg text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all">
                  Adicionar Produto
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-dark-200 mb-3 border-b border-dark-600/50 pb-2">Produtos Cadastrados ({products.length})</h3>
              {products.length === 0 ? (
                <div className="text-center py-8 text-dark-400">
                  Nenhum produto cadastrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(prod => (
                    <div key={prod.id} className="p-4 bg-dark-700/50 border border-dark-600/50 rounded-xl relative group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => deleteProduct(prod.id)} className="text-dark-400 hover:text-red-400 p-1">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(prod.segments || (prod.segment ? prod.segment.split(',').map(s => s.trim()) : [])).map((seg, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-1 bg-brand-500/15 text-brand-300 border border-brand-500/20 text-[10px] sm:text-xs font-medium rounded-lg text-center leading-tight">
                            {seg}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-white font-medium mb-1">{prod.name}</h4>
                      {prod.description && (
                         <p className="text-dark-300 text-xs line-clamp-2">{prod.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
