import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Save, X, User, MapPin, Phone, FileText, Key, DollarSign, Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Dashboard de Gestão de PROVEDORES - Updated 2025
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
  const [selectedProviderPayments, setSelectedProviderPayments] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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
      const token = localStorage.getItem('token');
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

  const loadProviderPayments = async (providerId) => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/providers/${providerId}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProviderPayments(response.data);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      setSelectedProviderPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Verificar se pagamento está atrasado
  const isOverdue = (payment) => {
    if (payment.status !== 'pending') return false;
    if (!payment.expires_at) return false;
    const expiryDate = new Date(payment.expires_at);
    const today = new Date();
    return expiryDate < today;
  };

  // Filtrar pagamentos por status
  const getFilteredPayments = () => {
    if (paymentFilter === 'todos') return selectedProviderPayments;
    if (paymentFilter === 'pago') return selectedProviderPayments.filter(p => p.status === 'paid');
    if (paymentFilter === 'aberto') return selectedProviderPayments.filter(p => p.status === 'pending' && !isOverdue(p));
    if (paymentFilter === 'atrasado') return selectedProviderPayments.filter(p => p.status === 'pending' && isOverdue(p));
    if (paymentFilter === 'cancelado') return selectedProviderPayments.filter(p => p.status === 'canceled' || p.status === 'cancelled');
    return selectedProviderPayments;
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
      const token = localStorage.getItem('token');
      
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
      const token = localStorage.getItem('token');
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

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm('Confirmar recebimento deste pagamento?')) return;
    
    try {
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
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

  const handleApproveDocuments = async () => {
    if (!selectedProvider) return;
    
    if (!window.confirm('Tem certeza que deseja APROVAR os documentos deste provedor?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/providers/${selectedProvider.id}/verify-documents`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('✅ Documentos aprovados com sucesso!');
      
      // Atualizar provider local
      setSelectedProvider(prev => ({
        ...prev,
        document_status: 'approved',
        document_verified_at: new Date().toISOString()
      }));
      
      // Recarregar lista de provedores
      loadProviders();
    } catch (error) {
      alert('Erro ao aprovar documentos: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDocuments = async () => {
    if (!selectedProvider) return;
    
    setShowRejectModal(true);
  };

  const confirmRejectDocuments = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da reprovação');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/providers/${selectedProvider.id}/verify-documents`,
        { 
          status: 'rejected',
          rejection_reason: rejectionReason
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('❌ Documentos reprovados com sucesso!');
      
      // Atualizar provider local
      setSelectedProvider(prev => ({
        ...prev,
        document_status: 'rejected',
        document_verified_at: new Date().toISOString(),
        document_rejection_reason: rejectionReason
      }));
      
      // Fechar modal e limpar
      setShowRejectModal(false);
      setRejectionReason('');
      
      // Recarregar lista de provedores
      loadProviders();
    } catch (error) {
      alert('Erro ao reprovar documentos: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
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
    { id: 'documentos', label: 'Documentos', icon: Shield },
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
          /* Edit Form - Gestão de Provedores */
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
                <div className="space-y-6">
                  {/* Configuração de Parcelas */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">Configuração de Parcelas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de Parcelas</label>
                        <input 
                          name="installments" 
                          type="number" 
                          min="1" 
                          max="12" 
                          value={selectedProvider?.installments || 1}
                          onChange={(e) => setSelectedProvider(prev => ({...prev, installments: parseInt(e.target.value)}))}
                          className="w-full px-3 py-2 border rounded" 
                          placeholder="Ex: 2, 3, 6, 12"
                        />
                        <p className="text-xs text-gray-500 mt-1">Cada parcela vence 1 mês após a anterior</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Valor da Parcela (R$)</label>
                        <input 
                          name="plan_value" 
                          type="number" 
                          step="0.01" 
                          value={selectedProvider?.plan_value || 0}
                          onChange={(e) => setSelectedProvider(prev => ({...prev, plan_value: parseFloat(e.target.value)}))}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Ex: 199.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor de cada parcela individual</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-white p-3 rounded border border-blue-300">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Total: <span className="text-lg font-bold text-blue-700">
                            R$ {((selectedProvider?.plan_value || 0) * (selectedProvider?.installments || 1)).toFixed(2)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedProvider?.installments || 1}x de R$ {(selectedProvider?.plan_value || 0).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const token = localStorage.getItem('token');
                            await axios.put(
                              `${API}/admin/providers/${selectedProvider.id}`,
                              {
                                installments: selectedProvider.installments || 1,
                                plan_value: selectedProvider.plan_value || 0
                              },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            alert('✅ Configurações salvas com sucesso!');
                            loadProviders();
                          } catch (error) {
                            console.error('Erro:', error);
                            alert('❌ Erro ao salvar: ' + (error.response?.data?.detail || error.message));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                      >
                        💾 Salvar Alterações
                      </button>
                    </div>
                  </div>

                  {/* Histórico de Pagamentos */}
                  {selectedProvider && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg">Histórico de Pagamentos</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const installments = selectedProvider.installments || 1;
                              const amount = selectedProvider.plan_value || 0;
                              const total = installments * amount;
                              
                              if (window.confirm(`Gerar ${installments} Boleto(s) para ${selectedProvider.name}?\n\n${installments}x R$ ${amount.toFixed(2)} = R$ ${total.toFixed(2)}\n\nVencimentos mensais (1º mês após contratação)`)) {
                                try {
                                  setLoading(true);
                                  const token = localStorage.getItem('token');
                                  await axios.post(
                                    `${API}/admin/providers/${selectedProvider.id}/generate-financial`,
                                    { 
                                      type: 'boleto', 
                                      amount: amount,
                                      installments: installments
                                    },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  alert(`✅ ${installments} boleto(s) gerado(s) com sucesso!`);
                                  loadProviderPayments(selectedProvider.id);
                                } catch (error) {
                                  console.error('Erro:', error);
                                  alert('❌ Erro ao gerar boleto: ' + (error.response?.data?.detail || error.message));
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            📄 Gerar Boletos
                          </button>
                          <button
                            onClick={() => loadProviderPayments(selectedProvider.id)}
                            disabled={loadingPayments}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loadingPayments ? 'Carregando...' : '🔄 Atualizar'}
                          </button>
                        </div>
                      </div>

                      {/* Filtros de Status */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <button 
                          onClick={() => setPaymentFilter('todos')}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            paymentFilter === 'todos' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Todos ({selectedProviderPayments.length})
                        </button>
                        <button 
                          onClick={() => setPaymentFilter('aberto')}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            paymentFilter === 'aberto' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          Em Aberto ({selectedProviderPayments.filter(p => p.status === 'pending' && !isOverdue(p)).length})
                        </button>
                        <button 
                          onClick={() => setPaymentFilter('atrasado')}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            paymentFilter === 'atrasado' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          Em Atraso ({selectedProviderPayments.filter(p => p.status === 'pending' && isOverdue(p)).length})
                        </button>
                        <button 
                          onClick={() => setPaymentFilter('pago')}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            paymentFilter === 'pago' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Pagos ({selectedProviderPayments.filter(p => p.status === 'paid').length})
                        </button>
                        <button 
                          onClick={() => setPaymentFilter('cancelado')}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                            paymentFilter === 'cancelado' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Cancelados ({selectedProviderPayments.filter(p => p.status === 'canceled' || p.status === 'cancelled').length})
                        </button>
                      </div>

                      {loadingPayments ? (
                        <div className="text-center py-8 text-gray-500">Carregando pagamentos...</div>
                      ) : getFilteredPayments().length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                          {paymentFilter === 'todos' ? 'Nenhum pagamento encontrado para este provedor' : `Nenhum pagamento ${paymentFilter}`}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getFilteredPayments().map((payment) => {
                            const overdue = isOverdue(payment);
                            const isPaid = payment.status === 'paid';
                            const isCanceled = payment.status === 'canceled' || payment.status === 'cancelled';
                            const isPending = payment.status === 'pending';
                            
                            return (
                            <div key={payment.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                              isPaid ? 'border-l-4 border-l-green-500 bg-green-50' :
                              isCanceled ? 'border-l-4 border-l-gray-400 bg-gray-50' :
                              overdue ? 'border-l-4 border-l-red-500 bg-red-50' :
                              isPending ? 'border-l-4 border-l-yellow-500 bg-yellow-50' :
                              'border-l-4 border-l-blue-500 bg-blue-50'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    isPaid ? 'bg-green-500' :
                                    isCanceled ? 'bg-gray-400' :
                                    overdue ? 'bg-red-500' :
                                    isPending ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {payment.payment_method === 'boleto' ? '📄 Boleto Bancário' : '💳 PIX'}
                                      {isPaid && <span className="ml-2 text-xs text-green-600 font-bold">✅ RECEBIDO</span>}
                                      {isCanceled && <span className="ml-2 text-xs text-gray-600 font-bold">❌ CANCELADO</span>}
                                      {overdue && <span className="ml-2 text-xs text-red-600 font-bold">⚠️ ATRASADO</span>}
                                    </h4>
                                    <p className="text-sm text-gray-500">ID: {payment.payment_id || payment.id}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">
                                    R$ {payment.amount ? payment.amount.toFixed(2) : '0.00'}
                                  </p>
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    isPaid ? 'bg-green-100 text-green-800' :
                                    isCanceled ? 'bg-gray-100 text-gray-700' :
                                    overdue ? 'bg-red-100 text-red-800' :
                                    isPending ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isPaid ? 'Recebido' :
                                     isCanceled ? 'Cancelado' :
                                     overdue ? 'Atrasado' :
                                     isPending ? 'Em Aberto' :
                                     'Aguardando'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                                <div>
                                  <p className="text-gray-500">Criado em:</p>
                                  <p className="font-medium">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                                </div>
                                {payment.expires_at && (
                                  <div>
                                    <p className="text-gray-500">Expira em:</p>
                                    <p className="font-medium">{new Date(payment.expires_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                )}
                                {payment.paid_at && (
                                  <div>
                                    <p className="text-gray-500">Pago em:</p>
                                    <p className="font-medium">{new Date(payment.paid_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                )}
                              </div>

                              {/* Ações */}
                              <div className="flex flex-wrap gap-2 pt-3 border-t">
                                {payment.status === 'pending' && (
                                  <button
                                    onClick={() => handleConfirmPayment(payment.id)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    ✓ Confirmar Recebimento
                                  </button>
                                )}
                                
                                {/* Abrir Boleto - só para pending */}
                                {payment.link && payment.status === 'pending' && (
                                  <button
                                    onClick={() => handlePrintBoleto(payment)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    🖨️ Abrir Boleto
                                  </button>
                                )}
                                
                                {/* Copiar PIX - só para pending */}
                                {payment.qr_code && payment.status === 'pending' && (
                                  <button
                                    onClick={() => handleCopyPix(payment.qr_code)}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                  >
                                    📋 Copiar Código PIX
                                  </button>
                                )}
                                
                                {(payment.status === 'pending' || payment.status === 'waiting') && (
                                  <button
                                    onClick={() => handleCancelPayment(payment.id)}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                  >
                                    ✕ Cancelar
                                  </button>
                                )}

                                {/* Copiar Código de Barras - só para pending */}
                                {payment.barcode && payment.status === 'pending' && (
                                  <button
                                    onClick={() => handleCopyPix(payment.barcode)}
                                    className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                  >
                                    Copiar Código de Barras
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documentos' && selectedProvider && (
                <div className="space-y-6">
                  {/* Status de Verificação */}
                  <div className={`border p-4 rounded-lg ${
                    selectedProvider.document_status === 'approved' ? 'bg-green-50 border-green-200' :
                    selectedProvider.document_status === 'rejected' ? 'bg-red-50 border-red-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold flex items-center gap-2 ${
                        selectedProvider.document_status === 'approved' ? 'text-green-900' :
                        selectedProvider.document_status === 'rejected' ? 'text-red-900' :
                        'text-yellow-900'
                      }`}>
                        <Shield className="w-5 h-5" />
                        Documentos de Identificação - Verificação de Segurança
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedProvider.document_status === 'approved' ? 'bg-green-600 text-white' :
                        selectedProvider.document_status === 'rejected' ? 'bg-red-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {selectedProvider.document_status === 'approved' ? '✓ APROVADO' :
                         selectedProvider.document_status === 'rejected' ? '✗ REPROVADO' :
                         '⏳ PENDENTE'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      selectedProvider.document_status === 'approved' ? 'text-green-800' :
                      selectedProvider.document_status === 'rejected' ? 'text-red-800' :
                      'text-yellow-800'
                    }`}>
                      {selectedProvider.document_status === 'approved' 
                        ? 'Documentos verificados e aprovados. Não é necessário verificar novamente.'
                        : selectedProvider.document_status === 'rejected'
                        ? 'Documentos foram reprovados. Verifique o motivo abaixo.'
                        : 'Fotos enviadas pelo provedor durante o cadastro para verificação de identidade.'}
                    </p>
                    {selectedProvider.document_verified_at && (
                      <p className="text-xs text-gray-600 mt-2">
                        Verificado em: {new Date(selectedProvider.document_verified_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {selectedProvider.document_rejection_reason && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                        <p className="text-sm font-semibold text-red-900">Motivo da Reprovação:</p>
                        <p className="text-sm text-red-800">{selectedProvider.document_rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApproveDocuments}
                      disabled={loading || selectedProvider.document_status === 'approved'}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      ✓ Aprovar Documentos
                    </button>
                    <button
                      onClick={handleRejectDocuments}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      ✗ Reprovar Documentos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Frente do RG/CNH */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📄 Frente do RG/CNH
                      </h4>
                      {selectedProvider.id_front_photo ? (
                        <div className="space-y-3">
                          <img 
                            src={selectedProvider.id_front_photo} 
                            alt="Frente do Documento" 
                            className="w-full h-48 object-contain border rounded bg-gray-50"
                          />
                          <button
                            onClick={() => window.open(selectedProvider.id_front_photo, '_blank')}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            🔍 Ver em Tamanho Real
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded text-gray-500">
                          Sem foto
                        </div>
                      )}
                    </div>

                    {/* Verso do RG/CNH */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        📄 Verso do RG/CNH
                      </h4>
                      {selectedProvider.id_back_photo ? (
                        <div className="space-y-3">
                          <img 
                            src={selectedProvider.id_back_photo} 
                            alt="Verso do Documento" 
                            className="w-full h-48 object-contain border rounded bg-gray-50"
                          />
                          <button
                            onClick={() => window.open(selectedProvider.id_back_photo, '_blank')}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            🔍 Ver em Tamanho Real
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded text-gray-500">
                          Sem foto
                        </div>
                      )}
                    </div>

                    {/* Segurando o Documento */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🤳 Segurando o Documento
                      </h4>
                      {selectedProvider.holding_id_photo ? (
                        <div className="space-y-3">
                          <img 
                            src={selectedProvider.holding_id_photo} 
                            alt="Segurando Documento" 
                            className="w-full h-48 object-contain border rounded bg-gray-50"
                          />
                          <button
                            onClick={() => window.open(selectedProvider.holding_id_photo, '_blank')}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            🔍 Ver em Tamanho Real
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded text-gray-500">
                          Sem foto
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Responsável */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      👤 Dados do Responsável
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Nome:</p>
                        <p className="font-medium">{selectedProvider.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CPF:</p>
                        <p className="font-medium">{selectedProvider.cpf || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CNPJ da Empresa:</p>
                        <p className="font-medium">{selectedProvider.cnpj || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email:</p>
                        <p className="font-medium">{selectedProvider.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Telefone:</p>
                        <p className="font-medium">{selectedProvider.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cidade/Estado:</p>
                        <p className="font-medium">
                          {selectedProvider.city && selectedProvider.state 
                            ? `${selectedProvider.city}/${selectedProvider.state}` 
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observações de Segurança */}
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">
                      ⚠️ Observações de Segurança
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Verifique se as fotos são claras e legíveis</li>
                      <li>• Confirme se os dados do documento correspondem aos dados cadastrados</li>
                      <li>• Verifique se a pessoa na foto segurando o documento é a mesma das fotos do documento</li>
                      <li>• Em caso de suspeita de fraude, bloqueie o provedor imediatamente</li>
                    </ul>
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Financeiro</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProviders.map((provider, idx) => {
                    const needsFinancial = !provider.financial_generated;
                    return (
                      <tr key={provider.id} onClick={() => setSelectedProvider(provider)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedProvider?.id === provider.id ? 'bg-blue-50' :
                          needsFinancial ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                        }`}>
                        <td className="px-6 py-4 text-sm">
                          {idx + 1}
                          {needsFinancial && <span className="ml-2 text-yellow-600">⚠️</span>}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {provider.name}
                          {needsFinancial && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Pendente Financeiro
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{provider.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{provider.cnpj || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {provider.city ? `${provider.city}/${provider.state}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {needsFinancial ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Aguardando Financeiro
                            </span>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {provider.is_active ? 'Ativo' : 'Bloqueado'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!provider.financial_generated ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-full font-medium border border-red-300">
                              ⚠️ Sem Financeiro
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-300">
                              ✓ Financeiro Gerado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={(e) => { e.stopPropagation(); handleEditProvider(provider); }}
                            className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Modal de Reprovação */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reprovar Documentos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Informe o motivo da reprovação dos documentos deste provedor:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4 min-h-[100px]"
              placeholder="Ex: Foto do documento está desfocada, CPF não corresponde ao documento, etc."
            />
            <div className="flex gap-3">
              <button
                onClick={confirmRejectDocuments}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Reprovação
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProviderDashboardSimple;
