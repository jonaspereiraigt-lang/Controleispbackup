import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Save, X, User, MapPin, Phone, FileText, Key, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const AdminProviderDashboardSimple = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', cnpj: '', cpf: '', phone: '', address: '',
    number: '', complement: '', neighborhood: '', city: '', state: '',
    cep: '', username: '', password: '', contract_number: '',
    contract_date: '', plan_type: 'mensal', plan_value: 199.00, payment_method: 'boleto'
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      alert('Erro ao carregar provedores');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    setIsEditing(true);
    setFormData({
      name: '', email: '', cnpj: '', cpf: '', phone: '', address: '',
      number: '', complement: '', neighborhood: '', city: '', state: '',
      cep: '', username: '', password: '', contract_number: '',
      contract_date: new Date().toISOString().split('T')[0],
      plan_type: 'mensal', plan_value: 199.00, payment_method: 'boleto'
    });
    setActiveTab('cliente');
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setIsEditing(true);
    setFormData({
      name: provider.name || '', email: provider.email || '',
      cnpj: provider.cnpj || '', cpf: provider.cpf || '',
      phone: provider.phone || '', address: provider.address || '',
      number: provider.number || '', complement: provider.complement || '',
      neighborhood: provider.neighborhood || '', city: provider.city || '',
      state: provider.state || '', cep: provider.cep || '',
      username: provider.username || provider.email || '', password: '',
      contract_number: provider.contract_number || '',
      contract_date: provider.contract_date || '',
      plan_type: provider.plan_type || 'mensal',
      plan_value: provider.plan_value || 199.00,
      payment_method: provider.payment_method || 'boleto'
    });
    setActiveTab('cliente');
  };

  const handleSaveProvider = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (selectedProvider) {
        await axios.put(`${API}/admin/providers/${selectedProvider.id}`, formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Provedor atualizado com sucesso!');
      } else {
        await axios.post(`${API}/admin/providers`, formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Provedor criado com sucesso!');
      }
      
      setIsEditing(false);
      setSelectedProvider(null);
      loadProviders();
    } catch (error) {
      console.error('Erro ao salvar provedor:', error);
      alert('Erro ao salvar provedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm('Tem certeza que deseja excluir este provedor?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/providers/${providerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Provedor excluído com sucesso!');
      loadProviders();
    } catch (error) {
      console.error('Erro ao excluir provedor:', error);
      alert('Erro ao excluir provedor');
    } finally {
      setLoading(false);
    }
  };

  const loadProviderPayments = async (providerId) => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/providers/${providerId}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm('Confirmar recebimento deste pagamento?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/payments/${paymentId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pagamento confirmado com sucesso!');
      if (selectedProvider) loadProviderPayments(selectedProvider.id);
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento');
    }
  };

  const handleCancelPayment = async (paymentId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pagamento?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/payments/${paymentId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pagamento cancelado com sucesso!');
      if (selectedProvider) loadProviderPayments(selectedProvider.id);
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      alert('Erro ao cancelar pagamento');
    }
  };

  const handlePrintBoleto = (payment) => {
    if (payment.pdf) {
      window.open(payment.pdf, '_blank');
    } else if (payment.link) {
      window.open(payment.link, '_blank');
    } else {
      alert('Link do boleto não disponível');
    }
  };

  const handleCopyPix = (pixCode) => {
    navigator.clipboard.writeText(pixCode);
    alert('Código PIX copiado para área de transferência!');
  };

  useEffect(() => {
    if (selectedProvider && activeTab === 'financeiro') {
      loadProviderPayments(selectedProvider.id);
    }
  }, [selectedProvider, activeTab]);

  const filteredProviders = providers.filter(provider =>
    provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.cnpj?.includes(searchTerm)
  );

  const tabs = [
    { id: 'cliente', label: 'Cliente', icon: User },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'contato', label: 'Contato', icon: Phone },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'logins', label: 'Logins', icon: Key },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Provedores</h1>
          <p className="text-gray-600">Gerencie todos os provedores cadastrados no sistema</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 bg-gray-700 p-3 rounded-lg">
          <button onClick={handleNewProvider} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Provedor
          </button>
          <button onClick={handleSaveProvider} disabled={!isEditing || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> Salvar
          </button>
          <button onClick={() => { setIsEditing(false); setSelectedProvider(null); }} disabled={!isEditing}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={() => selectedProvider && handleDeleteProvider(selectedProvider.id)} disabled={!selectedProvider}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Deletar
          </button>
        </div>

        {isEditing ? (
          /* Edit Form */
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">{selectedProvider ? 'Editar Provedor' : 'Novo Provedor'}</h2>
            
            {/* Tabs */}
            <div className="mb-6">
              <div className="flex gap-2 bg-gray-700 p-1 rounded-lg overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap ${
                        activeTab === tab.id ? 'bg-white text-gray-900' : 'text-white hover:bg-gray-600'
                      }`}>
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'cliente' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="Nome do provedor" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">E-mail *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="email@provedor.com.br" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNPJ</label>
                    <input name="cnpj" value={formData.cnpj} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF</label>
                    <input name="cpf" value={formData.cpf} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="000.000.000-00" />
                  </div>
                </div>
              )}

              {activeTab === 'endereco' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">CEP</label>
                    <input name="cep" value={formData.cep} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Endereço</label>
                    <input name="address" value={formData.address} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="Rua, Avenida..." />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Número</label>
                    <input name="number" value={formData.number} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="123" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Complemento</label>
                    <input name="complement" value={formData.complement} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="Sala, Bloco..." />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Bairro</label>
                    <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="Centro" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Cidade</label>
                    <input name="city" value={formData.city} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="São Paulo" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">UF</label>
                    <input name="state" value={formData.state} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="SP" maxLength={2} />
                  </div>
                </div>
              )}

              {activeTab === 'contato' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Telefone</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="(00) 00000-0000" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">E-mail</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="contato@provedor.com.br" />
                  </div>
                </div>
              )}

              {activeTab === 'contratos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Número do Contrato</label>
                    <input name="contract_number" value={formData.contract_number} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="CONTR-2025-001" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Data do Contrato</label>
                    <input name="contract_date" type="date" value={formData.contract_date} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
              )}

              {activeTab === 'logins' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Usuário</label>
                    <input name="username" value={formData.username} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded" placeholder="usuario@provedor.com.br" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Senha {selectedProvider && '(deixe em branco para manter)'}</label>
                    <div className="relative">
                      <input name="password" type={showPassword ? "text" : "password"}
                        value={formData.password} onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded" placeholder="Digite senha" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financeiro' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Tipo de Plano</label>
                    <select name="plan_type" value={formData.plan_type} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded">
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Valor (R$)</label>
                    <input name="plan_value" type="number" step="0.01" value={formData.plan_value}
                      onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                    <select name="payment_method" value={formData.payment_method} onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded">
                      <option value="boleto">Boleto</option>
                      <option value="pix">PIX</option>
                      <option value="cartao">Cartão</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Provedores ({filteredProviders.length})</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProviders.map((provider, idx) => (
                    <tr key={provider.id} onClick={() => setSelectedProvider(provider)}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedProvider?.id === provider.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 text-sm">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium">{provider.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{provider.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{provider.cnpj || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {provider.city ? `${provider.city}/${provider.state}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.is_active ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={(e) => { e.stopPropagation(); handleEditProvider(provider); }}
                          className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProviders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum provedor encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProviderDashboardSimple;
