import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save,
  X,
  MapPin,
  Phone,
  FileText,
  Key,
  DollarSign,
  User,
  Building,
  Mail
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const AdminProviderDashboard = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cnpj: '',
    cpf: '',
    phone: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    username: '',
    password: '',
    contract_number: '',
    contract_date: '',
    plan_type: 'mensal',
    plan_value: 199.00,
    payment_method: 'boleto'
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      toast.error('Erro ao carregar provedores');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    setIsEditing(true);
    setFormData({
      name: '',
      email: '',
      cnpj: '',
      cpf: '',
      phone: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: '',
      username: '',
      password: '',
      contract_number: '',
      contract_date: new Date().toISOString().split('T')[0],
      plan_type: 'mensal',
      plan_value: 199.00,
      payment_method: 'boleto'
    });
    setActiveTab('cliente');
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setIsEditing(true);
    setFormData({
      name: provider.name || '',
      email: provider.email || '',
      cnpj: provider.cnpj || '',
      cpf: provider.cpf || '',
      phone: provider.phone || '',
      address: provider.address || '',
      number: provider.number || '',
      complement: provider.complement || '',
      neighborhood: provider.neighborhood || '',
      city: provider.city || '',
      state: provider.state || '',
      cep: provider.cep || '',
      username: provider.username || provider.email || '',
      password: '',
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
      const token = localStorage.getItem('admin_token');
      
      if (selectedProvider) {
        // Update existing
        await axios.put(
          `${API}/admin/providers/${selectedProvider.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Provedor atualizado com sucesso!');
      } else {
        // Create new
        await axios.post(
          `${API}/admin/providers`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Provedor criado com sucesso!');
      }
      
      setIsEditing(false);
      setSelectedProvider(null);
      loadProviders();
    } catch (error) {
      console.error('Erro ao salvar provedor:', error);
      toast.error('Erro ao salvar provedor');
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!window.confirm('Tem certeza que deseja excluir este provedor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Provedor excluído com sucesso!');
      loadProviders();
    } catch (error) {
      console.error('Erro ao excluir provedor:', error);
      toast.error('Erro ao excluir provedor');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedProvider(null);
  };

  const filteredProviders = providers.filter(provider =>
    provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.cnpj?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestão de Provedores
          </h1>
          <p className="text-gray-600">
            Gerencie todos os provedores cadastrados no sistema
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 bg-gray-700 p-3 rounded-lg shadow-sm">
          <Button
            onClick={handleNewProvider}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Provedor
          </Button>
          <Button
            onClick={handleSaveProvider}
            disabled={!isEditing}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button
            onClick={handleCancel}
            disabled={!isEditing}
            variant="outline"
            className="disabled:opacity-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={() => selectedProvider && handleDeleteProvider(selectedProvider.id)}
            disabled={!selectedProvider}
            variant="destructive"
            className="disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar
          </Button>
        </div>

        {isEditing ? (
          /* Edit Form with Tabs */
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="text-xl">
                {selectedProvider ? 'Editar Provedor' : 'Novo Provedor'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-700 p-1 rounded-lg mb-6">
                  <TabsTrigger value="cliente" className="data-[state=active]:bg-white">
                    <User className="w-4 h-4 mr-2" />
                    Cliente
                  </TabsTrigger>
                  <TabsTrigger value="endereco" className="data-[state=active]:bg-white">
                    <MapPin className="w-4 h-4 mr-2" />
                    Endereço
                  </TabsTrigger>
                  <TabsTrigger value="contato" className="data-[state=active]:bg-white">
                    <Phone className="w-4 h-4 mr-2" />
                    Contato
                  </TabsTrigger>
                  <TabsTrigger value="contratos" className="data-[state=active]:bg-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Contratos
                  </TabsTrigger>
                  <TabsTrigger value="logins" className="data-[state=active]:bg-white">
                    <Key className="w-4 h-4 mr-2" />
                    Logins
                  </TabsTrigger>
                  <TabsTrigger value="financeiro" className="data-[state=active]:bg-white">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financeiro
                  </TabsTrigger>
                </TabsList>

                {/* Cliente Tab */}
                <TabsContent value="cliente" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Razão Social / Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Nome do provedor"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail Principal *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@provedor.com.br"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleInputChange}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Endereço Tab */}
                <TabsContent value="endereco" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Rua, Avenida, etc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        name="complement"
                        value={formData.complement}
                        onChange={handleInputChange}
                        placeholder="Sala, Bloco, etc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        placeholder="Centro"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">UF *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Contato Tab */}
                <TabsContent value="contato" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone Principal *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contato@provedor.com.br"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Contratos Tab */}
                <TabsContent value="contratos" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contract_number">Número do Contrato</Label>
                      <Input
                        id="contract_number"
                        name="contract_number"
                        value={formData.contract_number}
                        onChange={handleInputChange}
                        placeholder="CONTR-2025-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contract_date">Data do Contrato</Label>
                      <Input
                        id="contract_date"
                        name="contract_date"
                        type="date"
                        value={formData.contract_date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Logins Tab */}
                <TabsContent value="logins" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Informação:</strong> Essas são as credenciais de acesso do provedor ao sistema.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Usuário (Login) *</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="usuario@provedor.com.br"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">
                        Senha {selectedProvider ? '(deixe em branco para manter)' : '*'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Digite uma senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Financeiro Tab */}
                <TabsContent value="financeiro" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan_type">Tipo de Plano</Label>
                      <select
                        id="plan_type"
                        name="plan_type"
                        value={formData.plan_type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="plan_value">Valor do Plano (R$)</Label>
                      <Input
                        id="plan_value"
                        name="plan_value"
                        type="number"
                        step="0.01"
                        value={formData.plan_value}
                        onChange={handleInputChange}
                        placeholder="199.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_method">Forma de Pagamento</Label>
                      <select
                        id="payment_method"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="boleto">Boleto</option>
                        <option value="pix">PIX</option>
                        <option value="cartao">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          /* List View */
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  Lista de Provedores ({filteredProviders.length})
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar provedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cidade/UF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProviders.map((provider, index) => (
                      <tr
                        key={provider.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedProvider?.id === provider.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {provider.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.cnpj || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.city ? `${provider.city}/${provider.state}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            provider.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.is_active ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProvider(provider);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProviders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum provedor encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminProviderDashboard;
