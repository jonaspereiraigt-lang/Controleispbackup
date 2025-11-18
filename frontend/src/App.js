import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cropper from 'react-easy-crop';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Shield, Users, UserPlus, Building2, Phone, Mail, MapPin, DollarSign, Calendar, LogOut, FileText, Star, Search, AlertTriangle, AlertCircle, User, ChevronRight, Target, Database, Clock, Award, MessageCircle, CheckCircle, Bell, Plus, Edit3, Trash2, Info, Eye, EyeOff, Settings, Wifi, RefreshCw } from "lucide-react";
import AdminProviderDashboardSimple from "./components/AdminProviderDashboardSimple";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

// ERP Logo Component with Animation
const ERPLogo = ({ src, alt, delay }) => {
  return (
    <div 
      className="group relative"
      style={{
        animation: `fadeInUp 0.8s ease-out ${delay} both`
      }}
    >
      <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
        <img 
          src={src} 
          alt={alt}
          className="h-16 sm:h-20 w-auto object-contain mx-auto filter grayscale hover:grayscale-0 transition-all duration-300"
        />
      </div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs text-gray-300 whitespace-nowrap bg-gray-800 px-3 py-1 rounded-full">
          {alt}
        </span>
      </div>
    </div>
  );
};

// Integration Feature Component
const IntegrationFeature = ({ icon, title, description }) => {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-red-500 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-red-600 rounded-lg group-hover:bg-red-500 transition-colors duration-300">
          {icon}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors duration-300">
            {title}
          </h4>
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();
  
  // Estados para o slider de demonstração
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  // Estados para contador de visitantes
  const [visitorStats, setVisitorStats] = useState({
    total_visitors: 0,
    total_visits: 0,
    today_visitors: 0,
    this_month_visitors: 0
  });
  const [loadingVisitorStats, setLoadingVisitorStats] = useState(true);

  // Funções de navegação do slider
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-slide (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Muda de slide a cada 5 segundos

    return () => clearInterval(interval);
  }, [currentSlide]);

  // Função para registrar visita - DESABILITADA (endpoint não implementado)
  // const registerVisit = async () => {
  //   try {
  //     await axios.post(`${API}/public/visit`);
  //   } catch (error) {
  //     console.error("Erro ao registrar visita:", error);
  //   }
  // };

  // Função para carregar estatísticas de visitantes - DESABILITADA (endpoint não implementado)
  // const loadVisitorStats = async () => {
  //   try {
  //     const response = await axios.get(`${API}/public/visitor-count`);
  //     setVisitorStats(response.data);
  //   } catch (error) {
  //     console.error("Erro ao carregar estatísticas de visitantes:", error);
  //   } finally {
  //     setLoadingVisitorStats(false);
  //   }
  // };

  // Registrar visita e carregar estatísticas ao carregar a página - DESABILITADO
  // useEffect(() => {
  //   registerVisit();
  //   loadVisitorStats();
  // }, []);

  const features = [
    {
      icon: <Target className="w-8 h-8 text-red-600" />,
      title: "Controle Total",
      description: "Gerencie todos os seus clientes negativados em um só lugar com total organização e eficiência."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-red-600" />,
      title: "Cobrança Automática", 
      description: "Envie cobranças automáticas via WhatsApp para clientes em débito. Aumente sua taxa de recuperação."
    },
    {
      icon: <Database className="w-8 h-8 text-red-600" />,
      title: "Pesquisa Cruzada", 
      description: "Consulte clientes negativados de outros provedores antes de fazer novas contratações."
    },
    {
      icon: <Clock className="w-8 h-8 text-red-600" />,
      title: "Tempo Real",
      description: "Atualizações instantâneas e sincronização automática entre todos os provedores do sistema."
    },
    {
      icon: <Award className="w-8 h-8 text-red-600" />,
      title: "Profissional",
      description: "Sistema desenvolvido especialmente para provedores de internet com foco na inadimplência."
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "Proteção Garantida",
      description: "Evite prejuízos contratando apenas clientes com histórico limpo. Proteja seu negócio."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full py-4 sm:py-6">
            {/* Logo e Branding - Esquerda */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <img 
                  src="/logo-controleisp.jpg"
                  alt="ControleIsp"
                  className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl shadow-lg object-cover border-2 border-red-100"
                />
                <div className="absolute -top-1 -right-1 w-3 sm:w-4 h-3 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 tracking-tight">ControleIsp</h1>
                <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Controle Financeiro</p>
              </div>
            </div>
            
            {/* Menu de Recursos Expandido - Centro-Esquerda */}
            <div className="hidden lg:flex items-center gap-6 flex-grow justify-start ml-8">
              <div className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors cursor-pointer">
                <Shield className="w-5 h-5 text-red-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold">Proteção Total</div>
                  <div className="text-xs text-gray-500">Evite prejuízos</div>
                </div>
              </div>
              
              <div className="w-px h-8 bg-red-200"></div>
              
              <div className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors cursor-pointer">
                <Database className="w-5 h-5 text-red-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold">Pesquisa Cruzada</div>
                  <div className="text-xs text-gray-500">Entre provedores</div>
                </div>
              </div>
              
              <div className="w-px h-8 bg-red-200"></div>
              
              <div className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors cursor-pointer">
                <MessageCircle className="w-5 h-5 text-red-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold">WhatsApp Integrado</div>
                  <div className="text-xs text-gray-500">Cobranças automáticas</div>
                </div>
              </div>
            </div>
            
            {/* Card removido conforme solicitado */}
            
            {/* Botões de Ação - Direita */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Button 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-300 px-3 py-1.5 min-w-[120px]"
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline text-xs font-medium">Área do Assinante</span>
                <span className="sm:hidden text-xs">Login</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/login?register=true')}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all duration-300 px-3 py-1.5 font-semibold min-w-[120px]"
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline text-xs">Contratar Agora</span>
                <span className="sm:hidden text-xs">Contratar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Botão WhatsApp Flutuante */}
      <div className="fixed right-4 sm:right-6 bottom-6 z-50">
        <button
          onClick={() => window.open('https://wa.me/5588996149026?text=Olá! Quero contratar o ControleIsp!', '_blank')}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group relative overflow-hidden"
          aria-label="Falar no WhatsApp"
        >
          {/* Ícone do WhatsApp */}
          <svg 
            className="w-6 h-6 sm:w-7 sm:h-7" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.55-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          
          {/* Efeito de pulso */}
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Fale conosco no WhatsApp
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </button>
      </div>

      {/* Hero Section */}
      <section className="py-8 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Banner Responsivo Otimizado */}
          <div className="mb-8 sm:mb-12">
            <div className="relative w-full">
              <img 
                src="https://customer-assets.emergentagent.com/job_ispdebt/artifacts/9i18f5lo_banner%20site.jpg"
                alt="ControleIsp - Sistema de Gestão para Provedores de Internet"
                className="w-full rounded-2xl shadow-2xl bg-gray-100
                          h-48 sm:h-64 md:h-80 lg:h-auto xl:h-auto
                          object-cover sm:object-cover md:object-cover lg:object-contain xl:object-contain
                          object-center"
                loading="lazy"
              />
              {/* Overlay gradiente sutil para melhor legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 rounded-2xl"></div>
              
              {/* Badge flutuante opcional */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <span className="text-xs font-semibold text-red-600">Sistema Profissional</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-8">
              <Badge className="bg-red-100 text-red-700 border-red-200 mb-6">
                🚀 Solução Profissional para Provedores
              </Badge>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Controle Seus <span className="text-red-600">Clientes Negativados</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
                Sistema completo para gestão de inadimplência entre provedores de internet. 
                Evite contratar clientes com histórico negativo e proteja seu negócio.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Black Friday Promo Section - NO MEIO DA PÁGINA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-10 sm:p-16 shadow-2xl border-4 border-yellow-500 relative overflow-hidden">
            {/* Badge de destaque */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-base font-black px-8 py-4 rounded-full shadow-2xl animate-bounce z-10">
              🔥 BLACK FRIDAY
            </div>
            
            {/* Pattern de fundo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'}}></div>
            </div>
            
            <div className="text-center relative z-10">
              {/* Imagem Black Friday - MAIOR E DESTACADA */}
              <div className="mb-10 flex justify-center">
                <img 
                  src="https://customer-assets.emergentagent.com/job_ispcontrol-4/artifacts/au87a83l_IMG_1574.jpeg"
                  alt="Black Friday Sale"
                  className="w-56 h-56 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain animate-pulse drop-shadow-[0_0_50px_rgba(255,215,0,0.5)]"
                />
              </div>
              
              <div className="text-yellow-400 font-black mb-6 text-3xl sm:text-4xl">OFERTA LIMITADA</div>
              
              <div className="mb-8">
                <div className="text-gray-400 line-through text-xl sm:text-2xl mb-3">
                  De R$ 199,00/mês
                </div>
                <div className="flex items-baseline justify-center gap-4">
                  <span className="text-6xl sm:text-7xl md:text-8xl font-black text-green-400">R$ 99</span>
                  <span className="text-3xl sm:text-4xl text-green-300">/mês</span>
                </div>
              </div>
              
              <div className="bg-red-600 rounded-xl p-6 mb-8">
                <div className="text-white font-bold text-2xl sm:text-3xl mb-3">
                  💰 Economize R$ 300,00
                </div>
                <div className="text-red-100 text-base sm:text-lg">
                  Desconto de 50% nos 3 primeiros meses
                </div>
              </div>
              
              <div className="text-base text-gray-300 mb-8 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Todos os recursos inclusos</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Integração com ERPs (IXC, MK-Auth, SGP, RadiusNet)</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Cobrança automatizada via WhatsApp</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Suporte prioritário</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/login?register=true&promo=blackfriday')}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-black font-black px-10 py-6 text-lg sm:text-xl shadow-2xl w-full transform hover:scale-105 transition-all duration-300"
              >
                🎁 GARANTIR DESCONTO
              </Button>
              
              <p className="text-sm text-gray-400 mt-6">
                * Após 3 meses, valor volta para R$ 199,00/mês • Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ERP Integrations Section - DESTAQUE PRINCIPAL */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-red-600 rounded-full mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Integração Automática com os Principais ERPs
            </h3>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Sincronize automaticamente seus clientes inadimplentes e envie cobranças com boletos por WhatsApp
            </p>
          </div>

          {/* ERP Logos Carousel */}
          <div className="relative mb-12">
            <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
              <ERPLogo 
                src="https://customer-assets.emergentagent.com/job_ispcontrol-4/artifacts/n290ebf8_IMG_1570.png"
                alt="IXC Soft"
                delay="0s"
              />
              <ERPLogo 
                src="https://customer-assets.emergentagent.com/job_ispcontrol-4/artifacts/md3x1r6s_IMG_1571.png"
                alt="MK-Auth"
                delay="0.2s"
              />
              <ERPLogo 
                src="https://customer-assets.emergentagent.com/job_ispcontrol-4/artifacts/uwxfl5xq_IMG_1572.jpeg"
                alt="SGP TSMX"
                delay="0.4s"
              />
              <ERPLogo 
                src="https://customer-assets.emergentagent.com/job_ispcontrol-4/artifacts/tcvyo2fd_IMG_1573.jpeg"
                alt="RadiusNet"
                delay="0.6s"
              />
            </div>
          </div>

          {/* Integration Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
            <IntegrationFeature
              icon={<RefreshCw className="w-6 h-6" />}
              title="Sincronização Automática"
              description="Seus clientes inadimplentes são sincronizados automaticamente do seu ERP, mantendo dados sempre atualizados."
            />
            <IntegrationFeature
              icon={<FileText className="w-6 h-6" />}
              title="Boletos Integrados"
              description="Envie links diretos dos boletos e linha digitável via WhatsApp, facilitando o pagamento para seus clientes."
            />
            <IntegrationFeature
              icon={<MessageCircle className="w-6 h-6" />}
              title="Cobrança Inteligente"
              description="Mensagens personalizadas com os 2 boletos mais antigos, incluindo valores, vencimentos e opções de pagamento PIX."
            />
            <IntegrationFeature
              icon={<Clock className="w-6 h-6" />}
              title="Agendamento Flexível"
              description="Configure sincronizações automáticas diárias e mantenha seu controle sempre em dia sem esforço manual."
            />
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 sm:p-12 shadow-2xl">
            <h4 className="text-2xl sm:text-3xl font-bold mb-4">Conecte Seu ERP Agora!</h4>
            <p className="text-lg text-red-100 mb-6">
              Configure em minutos e comece a cobrar com eficiência
            </p>
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg"
            >
              <Wifi className="w-5 h-5 mr-2" />
              Começar Integração
            </Button>
          </div>
        </div>
      </section>

      {/* Lembretes de Pagamento Automáticos - Funcionalidade Principal */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    💡 Exclusivo
                  </Badge>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  Lembretes de Pagamento <span className="text-purple-600">Inteligentes</span>
                </h3>
                
                <p className="text-lg text-gray-600 mb-8">
                  Quando seu cliente promete pagar em uma data específica, nosso sistema agenda automaticamente 
                  um lembrete via WhatsApp com PIX integrado. Sem esquecer, sem perder dinheiro.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700"><strong>Agendamento Simples:</strong> Cliente prometeu pagar no dia 15? Agenda em 1 clique!</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700"><strong>PIX Automático:</strong> Mensagem já vai com sua chave PIX para pagamento direto</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700"><strong>Zero Esquecimento:</strong> O sistema lembra para você no dia prometido</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700"><strong>Anotações:</strong> Registre observações do cliente ("recebi no dia X")</span>
                  </div>
                </div>

                <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-800">Exemplo de Mensagem Automática:</span>
                  </div>
                  <p className="text-xs text-purple-700 italic">
                    "🗓️ Olá João! Hoje é o dia que você prometeu quitar sua pendência de R$ 89,90. 
                    PIX: 12.345.678/0001-90. Após pagar, envie o comprovante!"
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-8 sm:p-12 flex items-center">
                <div className="text-center text-white">
                  <div className="bg-white bg-opacity-20 rounded-full p-6 mb-6 mx-auto w-fit">
                    <div className="relative">
                      <Calendar className="w-12 h-12" />
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold mb-4">Nunca Mais Esqueça!</h4>
                  <p className="text-purple-100 mb-6">
                    Transforme promessas de pagamento em cobranças automáticas certeiras
                  </p>
                  
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-xl font-bold">85%</div>
                      <div className="text-xs text-purple-100">Clientes Cumprem</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-xl font-bold">3x</div>
                      <div className="text-xs text-purple-100">Mais Eficaz</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-purple-200">
                    ⚡ Funcionalidade exclusiva do ControleIsp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outras Automações WhatsApp */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Automações <span className="text-green-600">Completas</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Além dos lembretes inteligentes, tenha acesso a um arsenal completo de automações para recuperação de crédito
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cobrança Imediata */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="bg-red-100 p-3 rounded-full w-fit mb-4">
                <MessageCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cobrança Imediata</h3>
              <p className="text-gray-600 mb-4">
                Envie cobranças instantâneas via WhatsApp para clientes em débito. Mensagem profissional pronta.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>1 clique = cobrança enviada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Dados do débito inclusos</span>
                </div>
              </div>
            </div>

            {/* Cobrança Admin */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 p-3 rounded-full w-fit mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cobrança Administrativa</h3>
              <p className="text-gray-600 mb-4">
                Admin cobra provedores bloqueados automaticamente. Reativação rápida e comunicação clara.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Mensagem de reativação</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>PIX para pagamento direto</span>
                </div>
              </div>
            </div>

            {/* Pesquisa + Ação */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pesquisa + Ação</h3>
              <p className="text-gray-600 mb-4">
                Encontre negativados de outros provedores e aja imediatamente. Prevenção e cobrança integradas.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Base cruzada entre provedores</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Ação preventiva automática</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-8 inline-block">
              <h4 className="text-2xl font-bold mb-2">Resultado Garantido</h4>
              <p className="text-green-100 mb-4">Provedores recuperam em média <strong>+60% mais crédito</strong> usando nossas automações</p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-xl">92%</div>
                  <div className="text-green-200">Satisfação</div>
                </div>
                <div className="w-px h-8 bg-white opacity-30"></div>
                <div className="text-center">
                  <div className="font-bold text-xl">+60%</div>
                  <div className="text-green-200">Recuperação</div>
                </div>
                <div className="w-px h-8 bg-white opacity-30"></div>
                <div className="text-center">
                  <div className="font-bold text-xl">24h</div>
                  <div className="text-green-200">Suporte</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - Como Funciona */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Como Funciona o ControleIsp</h2>
            <p className="mt-4 text-xl text-gray-600">Veja passo a passo como nosso sistema facilita sua gestão</p>
          </div>

          {/* Demo Slider */}
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              
              {/* Slide 1 - Login */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</span>
                      <h3 className="text-2xl font-bold text-gray-900">Acesso Seguro</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Faça login de forma segura com seu email e senha. Sistema protegido com criptografia avançada.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Login seguro com JWT</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Proteção contra invasões</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Recuperação de senha</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <User className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Tela de Login</h4>
                      <div className="bg-white p-4 rounded shadow-sm">
                        <div className="h-3 bg-gray-200 rounded mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded mb-3"></div>
                        <div className="h-8 bg-red-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 2 - Dashboard */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</span>
                      <h3 className="text-2xl font-bold text-gray-900">Dashboard Intuitivo</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Acesse seu painel principal com visão geral de todos os clientes e funcionalidades.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Visão geral dos clientes</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Estatísticas em tempo real</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Acesso rápido às funções</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <Database className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Dashboard Principal</h4>
                      <div className="bg-white p-4 rounded shadow-sm space-y-2">
                        <div className="flex justify-between">
                          <div className="h-2 w-1/3 bg-blue-200 rounded"></div>
                          <div className="h-2 w-1/4 bg-green-200 rounded"></div>
                        </div>
                        <div className="h-16 bg-gray-50 rounded border"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-8 bg-red-100 rounded"></div>
                          <div className="h-8 bg-blue-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 3 - Cadastro de Clientes */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</span>
                      <h3 className="text-2xl font-bold text-gray-900">Cadastro Simplificado</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Cadastre clientes rapidamente com validação automática de CPF, CEP e dados completos.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Auto-preenchimento de endereço</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Validação automática de CPF</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Controle de duplicatas</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <UserPlus className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Cadastro de Cliente</h4>
                      <div className="bg-white p-4 rounded shadow-sm space-y-2">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-2 bg-gray-200 rounded"></div>
                          <div className="h-2 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 bg-green-600 rounded mt-3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 4 - Pesquisa Entre Provedores */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</span>
                      <h3 className="text-2xl font-bold text-gray-900">Pesquisa Inteligente</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Encontre clientes entre todos os provedores cadastrados. Evite inadimplentes conhecidos.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Busca por nome, CPF ou endereço</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Histórico de inadimplência</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Base compartilhada segura</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <Search className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Sistema de Pesquisa</h4>
                      <div className="bg-white p-4 rounded shadow-sm space-y-2">
                        <div className="flex">
                          <div className="flex-1 h-3 bg-gray-200 rounded-l"></div>
                          <div className="w-8 h-3 bg-blue-600 rounded-r"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-red-100 rounded"></div>
                          <div className="h-2 bg-yellow-100 rounded"></div>
                          <div className="h-2 bg-green-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 5 - Sistema de Cobrança */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">5</span>
                      <h3 className="text-2xl font-bold text-gray-900">Cobrança Automática</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Agende lembretes de pagamento com integração WhatsApp e geração automática de PIX.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Lembretes automáticos via WhatsApp</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Geração automática de PIX</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Agendamento flexível</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Sistema de Cobrança</h4>
                      <div className="bg-white p-4 rounded shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="h-1 flex-1 bg-gray-200 rounded mx-2"></div>
                        </div>
                        <div className="bg-green-50 p-2 rounded text-xs">WhatsApp</div>
                        <div className="bg-blue-50 p-2 rounded text-xs">PIX</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 6 - Relatórios */}
              <div className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-8 p-8">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">6</span>
                      <h3 className="text-2xl font-bold text-gray-900">Relatórios e Contratos</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Gere contratos profissionais em PDF e acompanhe estatísticas detalhadas do seu negócio.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Contratos em PDF profissionais</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Relatórios de performance</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span>Histórico completo de ações</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <h4 className="font-semibold mb-2">Relatórios</h4>
                      <div className="bg-white p-4 rounded shadow-sm space-y-2">
                        <div className="h-1 bg-red-600 rounded w-full"></div>
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-1 bg-gray-200 rounded w-full"></div>
                          <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <div className="h-1 bg-blue-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[...Array(totalSlides)].map((_, index) => (
                <button 
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    currentSlide === index ? 'bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Call to Action removido */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Recursos Completos do Sistema
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Tudo que seu provedor precisa para controlar inadimplência e proteger seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <MapPin className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-red-200" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">Atendimento em Todo o Território Brasileiro</h3>
            <p className="text-lg sm:text-xl text-red-100 mb-8 px-4">
              Suporte especializado para provedores de internet de norte a sul do país
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white bg-opacity-10 rounded-lg p-4 sm:p-6">
              <Phone className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-3 text-red-200" />
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Suporte por WhatsApp</h4>
              <p className="text-red-100 text-xs sm:text-sm">Atendimento rápido e personalizado</p>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-lg p-4 sm:p-6">
              <Clock className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-3 text-red-200" />
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Horário Comercial</h4>
              <p className="text-red-100 text-xs sm:text-sm">Segunda a Sexta, 8h às 18h</p>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-lg p-4 sm:p-6">
              <MapPin className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-3 text-red-200" />
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Cobertura Nacional</h4>
              <p className="text-red-100 text-xs sm:text-sm">Todos os estados brasileiros</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-6">
            Comece Hoje Mesmo!
          </h3>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 px-4">
            Proteja seu provedor de internet contra inadimplência. Cadastre-se agora e tenha acesso imediato ao sistema.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Cadastrar Meu Provedor
            </Button>
            
            <Button 
              onClick={() => window.open('https://wa.me/5588996149026?text=Olá! Quero saber mais sobre o ControleIsp!', '_blank')}
              variant="outline"
              size="lg"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Lembrete Promoção Black Friday - Antes do Footer */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black py-8 border-t-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-4 rounded-full animate-bounce">
                <span className="text-3xl">🔥</span>
              </div>
              <div>
                <h3 className="text-yellow-400 font-black text-xl sm:text-2xl mb-1">
                  NÃO PERCA A BLACK FRIDAY!
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  R$ 99,00/mês por 3 meses • Economia de R$ 300,00
                </p>
              </div>
            </div>
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => navigate('/login?register=true&promo=blackfriday'), 300);
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-black font-bold px-8 py-4 text-base sm:text-lg shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🎁 APROVEITAR AGORA
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo-controleisp.jpg"
                  alt="ControleIsp"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h4 className="text-xl font-bold text-red-400">ControleIsp</h4>
                  <p className="text-gray-400">Sistema de Gestão de Clientes Negativos</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Solução completa para provedores de internet gerenciarem clientes negativados 
                e consultarem histórico de inadimplência entre provedores.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold text-red-400 mb-3">Acesso Rápido</h5>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-red-400 transition-colors">
                    Área do Assinante
                  </button>
                </li>
                <li>
                  <button onClick={() => window.open('https://wa.me/5588996149026', '_blank')} className="hover:text-red-400 transition-colors">
                    Suporte WhatsApp
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-red-400 mb-3">Contato</h5>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>(88) 9 9614-9026</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contato@controleisp.com.br</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Todo o Brasil</span>
                </li>
              </ul>
            </div>
            
            {/* Card de Visitantes */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white">
              <h5 className="font-semibold text-red-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Visitantes
              </h5>
              
              {loadingVisitorStats ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-6 bg-red-400 rounded mb-2"></div>
                    <div className="h-4 bg-red-400 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-red-400 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {visitorStats.total_visitors.toLocaleString()}
                    </div>
                    <div className="text-red-200 text-sm">Visitantes únicos</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-red-500/30 rounded">
                      <div className="font-semibold">{visitorStats.today_visitors}</div>
                      <div className="text-red-200 text-xs">Hoje</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/30 rounded">
                      <div className="font-semibold">{visitorStats.this_month_visitors}</div>
                      <div className="text-red-200 text-xs">Este mês</div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-2 border-t border-red-400">
                    <div className="text-lg font-semibold">{visitorStats.total_visits.toLocaleString()}</div>
                    <div className="text-red-200 text-xs">Total de visitas</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 ControleIsp. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Login Component
const Login = ({ onLogin }) => {
  const location = useLocation();
  // Apenas para provedores - admin foi separado
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    nome_fantasia: "",
    email: "",
    password: "",
    confirmPassword: "",  // Confirmar senha
    cnpj: "",
    cpf: "",  // CPF do responsável
    phone: "",
    address: "",
    number: "",  // Número do endereço
    bairro: "",
    cep: "",
    city: "",
    state: "",
    id_front_photo: null,
    id_back_photo: null,
    holding_id_photo: null,
    logo_photo: null,  // Logo do provedor
    contract_accepted: false,
    due_day: 10  // Default: dia 10
  });
  
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState("provider");

  // Verificar se deve abrir modal de cadastro
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('register') === 'true') {
      setShowRegister(true);
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData({
      ...registerData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCnpjBlur = async (cnpj) => {
    if (cnpj && cnpj.length >= 14) {
      try {
        const response = await axios.post(`${API}/validate/cnpj`, { cnpj });
        if (response.data.success) {
          const data = response.data;
          
          // Limpar e validar telefone - pegar apenas números e limitar a 11 dígitos
          let cleanPhone = data.telefone || '';
          if (cleanPhone) {
            cleanPhone = cleanPhone.replace(/\D/g, ''); // Remove tudo que não é número
            // Se tem mais de 11 dígitos, pegar apenas os primeiros 11
            if (cleanPhone.length > 11) {
              console.log(`Telefone da API muito longo (${cleanPhone.length} dígitos), usando apenas os primeiros 11`);
              cleanPhone = cleanPhone.substring(0, 11);
            }
          }
          
          setRegisterData(prev => ({
            ...prev,
            name: data.nome || prev.name, // Razão Social
            nome_fantasia: data.fantasia || prev.nome_fantasia, // Nome Fantasia
            email: data.email || prev.email,
            phone: cleanPhone || prev.phone, // Usa telefone limpo da API ou mantém o anterior
            address: data.endereco.logradouro || prev.address,
            bairro: data.endereco.bairro || prev.bairro,
            cep: data.endereco.cep || prev.cep,
            city: data.endereco.municipio || prev.city,
            state: data.endereco.uf || prev.state
          }));
          toast.success("Dados da empresa carregados automaticamente!");
        } else if (response.data.error) {
          toast.warning(`CNPJ: ${response.data.error}`);
        }
      } catch (error) {
        console.log("Erro na consulta CNPJ:", error.message);
      }
    }
  };

  const handleCepBlur = async (cep) => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      try {
        const response = await axios.post(`${API}/validate/cep`, { cep });
        if (response.data.success) {
          const data = response.data;
          setRegisterData(prev => ({
            ...prev,
            cep: data.cep,
            address: data.logradouro || prev.address,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success("Endereço carregado automaticamente pelo CEP!");
        } else if (response.data.error) {
          toast.error(`CEP: ${response.data.error}`);
        }
      } catch (error) {
        toast.error("Erro na consulta do CEP");
      }
    }
  };

  const handleRegisterFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRegisterData({
          ...registerData,
          [field]: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = "provider"; // Apenas provedor nesta tela
      const response = await axios.post(`${API}/auth/${endpoint}/login`, formData);
      
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("userType", "provider");
      
      // Salvar informações do primeiro login
      if (response.data.first_login !== undefined) {
        localStorage.setItem("first_login", response.data.first_login);
      }
      if (response.data.terms_accepted !== undefined) {
        localStorage.setItem("terms_accepted", response.data.terms_accepted);
      }
      if (response.data.due_day !== undefined) {
        localStorage.setItem("due_day", response.data.due_day);
      }
      if (response.data.financial_generated !== undefined) {
        localStorage.setItem("financial_generated", response.data.financial_generated);
      }
      
      onLogin(response.data.user_type);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      toast.error("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validação de confirmação de senha
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("As senhas não coincidem! Por favor, verifique.");
      setLoading(false);
      return;
    }
    
    // Validação rigorosa dos campos obrigatórios
    const requiredFields = [
      'name', 'nome_fantasia', 'email', 'password', 'cnpj', 'cpf', 'phone', 
      'address', 'number', 'bairro', 'cep', 'city', 'state', 'id_front_photo', 'id_back_photo', 'holding_id_photo'
    ];
    
    for (let field of requiredFields) {
      if (!registerData[field] || registerData[field] === '') {
        const fieldNames = {
          'name': 'Razão Social',
          'nome_fantasia': 'Nome Fantasia',
          'email': 'E-mail',
          'password': 'Senha',
          'cnpj': 'CNPJ',
          'cpf': 'CPF do Responsável',
          'phone': 'Telefone',
          'address': 'Endereço',
          'number': 'Número',
          'bairro': 'Bairro',
          'cep': 'CEP',
          'city': 'Cidade',
          'state': 'Estado',
          'id_front_photo': 'Foto Frente do RG/CNH',
          'id_back_photo': 'Foto Verso do RG/CNH',
          'holding_id_photo': 'Foto Segurando RG/CNH'
        };
        toast.error(`Campo obrigatório não preenchido: ${fieldNames[field] || field}`);
        setLoading(false);
        return;
      }
    }
    
    if (!registerData.contract_accepted) {
      toast.error("Você deve aceitar os termos do contrato para prosseguir");
      setLoading(false);
      return;
    }
    
    try {
      // Remove confirmPassword before sending (not needed in backend)
      const { confirmPassword, ...dataToSend } = registerData;
      
      console.log("📤 Dados sendo enviados para o backend:", dataToSend);
      
      await axios.post(`${API}/provider/register`, dataToSend);
      toast.success("Provedor cadastrado com sucesso! Faça login com suas credenciais.");
      setShowRegister(false);
      setRegisterData({
        name: "",
        nome_fantasia: "",
        email: "",
        password: "",
        confirmPassword: "",
        cnpj: "",
        cpf: "",
        phone: "",
        address: "",
        number: "",
        bairro: "",
        cep: "",
        city: "",
        state: "",
        id_front_photo: null,
        id_back_photo: null,
        holding_id_photo: null,
        logo_photo: null,
        contract_accepted: false,
        due_day: 10
      });
      setLoginMode("provider");
    } catch (error) {
      toast.error("Erro ao cadastrar provedor: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // Funções de logo removidas - identificação por nome fantasia

  // Função uploadLogoRegistration removida

  // Função uploadLogoBase64 removida

  // Função uploadLogoProductionDomain removida

  // Função uploadLogoWithFallback removida

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotPasswordEmail });
      toast.success("Instruções de recuperação enviadas para seu email!");
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      toast.error("Erro ao enviar email de recuperação: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex flex-col">
      {/* Cabeçalho */}
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <img 
            src="/logo-controleisp.jpg"
            alt="ControleIsp"
            className="w-24 h-24 mx-auto mb-4 rounded-xl shadow-lg object-cover"
          />
          <h1 className="text-4xl font-bold text-red-600 mb-2">ControleIsp</h1>
          <p className="text-gray-600 text-lg">Sistema de Gestão de Clientes Negativos</p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          
          {/* Área Exclusiva do Provedor */}

          {/* Card de Login */}
          <Card className="shadow-xl border-red-100">
            <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5" />
                Login de Provedor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="email"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Digite seu email"
                    className="mt-1 border-gray-300 focus:border-red-500"
                    required
                    data-testid="login-username-input"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha"
                    className="mt-1 border-gray-300 focus:border-red-500"
                    required
                    data-testid="login-password-input"
                  />
                  {loginMode === "provider" && (
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-red-600 hover:text-red-700 hover:underline"
                        data-testid="forgot-password-button"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 mt-6 font-medium"
                  disabled={loading}
                  data-testid="login-submit-button"
                >
                  {loading ? "Entrando..." : "Entrar como Provedor"}
                </Button>
              </form>

              {loginMode === "provider" && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 mb-3">
                    Ainda não tem conta?
                  </p>
                  <Button 
                    type="button"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg border-0 py-3 text-base font-semibold"
                    onClick={() => setShowRegister(true)}
                    data-testid="register-provider-button"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    🚀 Cadastre seu Provedor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Suporte WhatsApp */}
          <div className="mt-6">
            <Button
              onClick={() => window.open('https://wa.me/5588996149026?text=Olá! Preciso de suporte com o sistema ControleIsp.', '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md border border-green-500 py-3"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              💬 Suporte via WhatsApp
            </Button>
          </div>

        {/* Modal de Cadastro de Provedor */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Provedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* CNPJ como primeiro campo - preenche dados automaticamente */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <Label htmlFor="register-cnpj" className="text-lg font-semibold text-blue-900">
                  🏢 CNPJ da Empresa * (Preencha primeiro)
                </Label>
                <Input
                  id="register-cnpj"
                  name="cnpj"
                  value={registerData.cnpj}
                  onChange={handleRegisterInputChange}
                  onBlur={(e) => handleCnpjBlur(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                  className="mt-2 text-lg"
                  data-testid="register-cnpj-input"
                />
                <p className="text-sm text-blue-700 mt-2 font-medium">
                  💡 Digite o CNPJ e pressione Tab - os dados da empresa serão preenchidos automaticamente!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-name">Razão Social</Label>
                  <Input
                    id="register-name"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterInputChange}
                    required
                    data-testid="register-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-nome-fantasia">Nome Fantasia *</Label>
                  <Input
                    id="register-nome-fantasia"
                    name="nome_fantasia"
                    value={registerData.nome_fantasia}
                    onChange={handleRegisterInputChange}
                    placeholder="Nome comercial da empresa"
                    required
                    data-testid="register-nome-fantasia-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-cpf">CPF do Responsável *</Label>
                  <Input
                    id="register-cpf"
                    name="cpf"
                    value={registerData.cpf}
                    onChange={handleRegisterInputChange}
                    placeholder="000.000.000-00"
                    required
                    data-testid="register-cpf-input"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    CPF do sócio/responsável pela empresa
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-email">E-mail</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterInputChange}
                    required
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-phone">Telefone (com DDD)</Label>
                  <Input
                    id="register-phone"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterInputChange}
                    placeholder="(88) 98765-4321"
                    required
                    data-testid="register-phone-input"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    📱 Formato: DDD + número (ex: 11987654321)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="register-cep">CEP</Label>
                  <Input
                    id="register-cep"
                    name="cep"
                    value={registerData.cep}
                    onChange={handleRegisterInputChange}
                    onBlur={(e) => handleCepBlur(e.target.value)}
                    placeholder="00000-000 (preenche endereço automaticamente)"
                    required
                    data-testid="register-cep-input"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    💡 Digite o CEP para preencher o endereço
                  </p>
                </div>
                <div>
                  <Label htmlFor="register-city">Cidade</Label>
                  <Input
                    id="register-city"
                    name="city"
                    value={registerData.city}
                    onChange={handleRegisterInputChange}
                    required
                    data-testid="register-city-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-state">Estado</Label>
                  <Input
                    id="register-state"
                    name="state"
                    value={registerData.state}
                    onChange={handleRegisterInputChange}
                    placeholder="UF"
                    maxLength="2"
                    required
                    data-testid="register-state-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="register-address">Endereço (Rua/Avenida) *</Label>
                  <Input
                    id="register-address"
                    name="address"
                    value={registerData.address}
                    onChange={handleRegisterInputChange}
                    placeholder="Rua das Flores"
                    required
                    data-testid="register-address-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-number">Número *</Label>
                  <Input
                    id="register-number"
                    name="number"
                    value={registerData.number}
                    onChange={handleRegisterInputChange}
                    placeholder="123"
                    required
                    data-testid="register-number-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="register-bairro">Bairro *</Label>
                <Input
                  id="register-bairro"
                  name="bairro"
                  value={registerData.bairro}
                  onChange={handleRegisterInputChange}
                  placeholder="Nome do bairro"
                  required
                  data-testid="register-bairro-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-password">Senha de Acesso</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    value={registerData.password}
                    onChange={handleRegisterInputChange}
                    placeholder="Digite uma senha para acessar o sistema"
                    required
                    data-testid="register-password-input"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Você fará login com seu email cadastrado acima
                  </p>
                </div>
                <div>
                  <Label htmlFor="register-confirm-password">Confirmar Senha *</Label>
                  <Input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterInputChange}
                    placeholder="Digite a senha novamente"
                    required
                    data-testid="register-confirm-password-input"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Repita a senha para confirmação
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="register-due-day">Dia de Vencimento das Parcelas *</Label>
                <select
                  id="register-due-day"
                  name="due_day"
                  value={registerData.due_day}
                  onChange={handleRegisterInputChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="register-due-day-select"
                >
                  <option value={5}>Dia 5</option>
                  <option value={10}>Dia 10</option>
                  <option value={15}>Dia 15</option>
                  <option value={20}>Dia 20</option>
                  <option value={25}>Dia 25</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  💳 Escolha o dia do mês para vencimento das mensalidades
                </p>
              </div>

              {/* Logo removido - identificação por nome fantasia */}

              {/* Comprovação de Identidade do Provedor */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Comprovação de Identidade do Responsável
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="register_id_front">Foto da Frente do RG/CNH *</Label>
                    <Input
                      id="register_id_front"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleRegisterFileUpload(e, 'id_front_photo')}
                      required
                      data-testid="register-id-front-input"
                      className="mt-1"
                    />
                    {registerData.id_front_photo && (
                      <div className="mt-2">
                        <img src={registerData.id_front_photo} alt="Frente ID" className="w-32 h-20 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="register_id_back">Foto do Verso do RG/CNH *</Label>
                    <Input
                      id="register_id_back"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleRegisterFileUpload(e, 'id_back_photo')}
                      required
                      data-testid="register-id-back-input"
                      className="mt-1"
                    />
                    {registerData.id_back_photo && (
                      <div className="mt-2">
                        <img src={registerData.id_back_photo} alt="Verso ID" className="w-32 h-20 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="register_holding_id">Foto Segurando o RG/CNH *</Label>
                    <Input
                      id="register_holding_id"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleRegisterFileUpload(e, 'holding_id_photo')}
                      required
                      data-testid="register-holding-id-input"
                      className="mt-1"
                    />
                    {registerData.holding_id_photo && (
                      <div className="mt-2">
                        <img src={registerData.holding_id_photo} alt="Segurando ID" className="w-32 h-20 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo do Provedor */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" />
                  Logo da Empresa (Opcional)
                </h3>
                <div>
                  <Label htmlFor="register_logo">Logo do Provedor</Label>
                  <Input
                    id="register_logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleRegisterFileUpload(e, 'logo_photo')}
                    data-testid="register-logo-input"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    📸 Esta logo aparecerá nos contratos e cobranças que você enviar aos seus clientes
                  </p>
                  {registerData.logo_photo && (
                    <div className="mt-2">
                      <img src={registerData.logo_photo} alt="Logo" className="w-32 h-32 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </div>

              {/* Contrato de Aceite do Provedor */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Contrato Control-ISP (v3.0 - LGPD)
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto border">
                  <div className="space-y-4 text-sm font-mono">
                    <div className="text-center font-bold text-red-600 text-lg">
                      📜 CONTRATO DE ADESÃO - CONTROL-ISP (Versão 3.0 - Inclui LGPD)
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <strong>🎯 1. OBJETO DO CONTRATO:</strong> Prestação de serviços de sistema digital para controle interno de dívidas entre provedores de internet, denominado "ControleIsp", destinado exclusivamente ao controle e gestão de inadimplências.
                      </div>
                      
                      <div>
                        <strong>🔒 2. COMPROMISSO DE SIGILO:</strong> O contratante compromete-se a manter absoluto sigilo sobre todas as informações acessadas no sistema, sob pena de rescisão imediata e aplicação de multa. É EXPRESSAMENTE PROIBIDO compartilhar o acesso com terceiros ou divulgar a clientes sobre a existência do sistema (multa: R$ 10.000,00).
                      </div>
                      
                      <div>
                        <strong>⚖️ 3. ISENÇÃO DE RESPONSABILIDADE:</strong> O ControleIsp se isenta de toda responsabilidade por problemas, conflitos ou questões entre o provedor e seus clientes. O sistema NÃO atua como intermediário. Responsabilidade exclusiva do provedor contratante.
                      </div>
                      
                      <div>
                        <strong>📋 4. NATUREZA DO SISTEMA:</strong> Destinado EXCLUSIVAMENTE para controle interno. NÃO inclui, NÃO registra e NÃO envia informações para órgãos de proteção ao crédito. Ferramenta de consulta privada entre provedores.
                      </div>
                      
                      <div>
                        <strong>💰 5. CONDIÇÕES FINANCEIRAS:</strong> Valor: R$ 99,00 (noventa e nove reais) mensais. Vencimento: Dia do cadastro. Inadimplência: Bloqueio imediato do acesso.
                      </div>
                      
                      <div>
                        <strong>📊 6. VERACIDADE DAS INFORMAÇÕES:</strong> Todas as informações inseridas devem ser verdadeiras, precisas e atualizadas. Dados falsos resultam em multa de R$ 5.000,00 e exclusão imediata do sistema.
                      </div>
                      
                      <div>
                        <strong>⚠️ 7. PENALIDADES:</strong> Quebra de contrato resulta em exclusão imediata sem direito a reembolso.
                      </div>
                      
                      <div>
                        <strong>🛡️ 8. CONFORMIDADE LGPD:</strong> Sistema em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Tratamento baseado no legítimo interesse. Dados coletados: nome, CPF, endereço, telefone, valor da dívida. NÃO coletamos dados sensíveis.
                      </div>
                      
                      <div>
                        <strong>📄 9. DIREITOS DOS TITULARES:</strong> Os titulares têm direito a confirmação, acesso, correção, anonimização, eliminação e informações sobre compartilhamento. Medidas de segurança implementadas contra acessos não autorizados.
                      </div>
                      
                      <div>
                        <strong>📝 10. DISPOSIÇÕES FINAIS:</strong> Foro: São Paulo/SP. Vigência: Durante pagamento em dia. Aceitação: Ao marcar "Aceito os Termos", confirma ter lido e concordado integralmente com todas as cláusulas, incluindo proteção de dados.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="register_contract_accepted"
                    name="contract_accepted"
                    checked={registerData.contract_accepted}
                    onChange={handleRegisterInputChange}
                    required
                    data-testid="register-contract-accept-checkbox"
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <Label htmlFor="register_contract_accepted" className="text-sm font-medium">
                    Li e aceito integralmente os termos do contrato Control-ISP (v3.0 - LGPD) *
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRegister(false)}
                  data-testid="cancel-register-button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading || !registerData.contract_accepted || !registerData.id_front_photo || !registerData.id_back_photo || !registerData.holding_id_photo}
                  data-testid="save-register-button"
                >
                  {loading ? "Cadastrando..." : "Cadastrar Provedor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Esqueci a Senha */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Recuperar Senha</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email do Provedor</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Digite seu email cadastrado"
                  className="mt-1 border-gray-300 focus:border-red-500"
                  required
                  data-testid="forgot-password-email-input"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Enviaremos instruções para redefinir sua senha
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForgotPassword(false)}
                  data-testid="cancel-forgot-password-button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                  data-testid="send-reset-email-button"
                >
                  {loading ? "Enviando..." : "Enviar Email"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="text-gray-700 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Desenvolvido para Provedores de Internet em Todo o Brasil</p>
            <p className="text-sm">Todos os Direitos Reservados</p>
            <p className="text-xs text-gray-600">© 2025 ControleIsp</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Admin Login Component (Separado e Seguro)
const AdminLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, {
        username: formData.username,
        password: formData.password
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("userName", formData.username);
        onLogin("admin", formData.username);
        toast.success("Login de admin realizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro no login do admin:", error);
      toast.error("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo e Título Especial Admin */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src="/logo-controleisp.jpg"
                alt="ControleIsp Admin"
                className="w-16 h-16 rounded-xl shadow-lg object-cover border-2 border-red-400"
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ControleIsp</h1>
          <p className="text-red-200 text-sm">Área Administrativa Restrita</p>
        </div>

        {/* Card de Login Admin */}
        <Card className="shadow-2xl border-red-500/30 bg-black/60 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-t-lg">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Login Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-200">Usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 border-red-300 focus:border-red-500 bg-black/40 text-white placeholder-gray-400"
                    placeholder="Digite seu usuário admin"
                    required
                    data-testid="admin-username-input"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-200">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 border-red-300 focus:border-red-500 bg-black/40 text-white placeholder-gray-400"
                    placeholder="Digite sua senha admin"
                    required
                    data-testid="admin-password-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="admin-login-submit-button"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Acessar Painel Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Aviso de Segurança */}
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-red-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">Área Restrita</span>
          </div>
          <p className="text-xs text-red-300 mt-1">
            Acesso exclusivo para administradores autorizados. 
            Todas as ações são registradas e monitoradas.
          </p>
        </div>
      </div>

      {/* Rodapé Admin */}
      <footer className="fixed bottom-0 left-0 right-0 text-gray-400 py-4 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-xs">ControleIsp Admin Panel | Todos os Direitos Reservados | © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = ({ onLogout }) => {
  const [allProviders, setAllProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [selectedProviderClients, setSelectedProviderClients] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueStats, setRevenueStats] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    active_subscriptions: 0,
    total_subscriptions: 0
  });

  // Estados do sistema de notificações
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Estados para integrações
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [integrationTypes, setIntegrationTypes] = useState([]);
  const [providerIntegrations, setProviderIntegrations] = useState([]);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    display_name: '',
    api_url: '',
    credentials: {},
    settings: {
      debt_days_threshold: 5,
      debt_amount_min: 50
    }
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    message: '',
    scheduled_for: ''
  });
  const [editingNotification, setEditingNotification] = useState(null);

  // Estados para gerenciamento do banco de dados
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [databaseStats, setDatabaseStats] = useState({});
  const [loadingDatabaseStats, setLoadingDatabaseStats] = useState(false);
  const [clearingDatabase, setClearingDatabase] = useState(false);

  // Estados para backup de banco de dados
  const [backingUpDatabase, setBackingUpDatabase] = useState(false);
  const [generatingBackup, setGeneratingBackup] = useState(false);
  
  // Estado para mostrar dashboard de gestão de provedores
  const [showProviderManagement, setShowProviderManagement] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  
  // Estados para sistema de pagamentos - REMOVIDO (sistema não é mais gratuito)

  useEffect(() => {
    loadProviders();
    loadNotifications();
    loadDatabaseStats();
    loadRevenueStats();
  }, []);

  // Atualização automática das estatísticas - pausa quando modal de provedores está aberto
  useEffect(() => {
    // Não iniciar atualização se o modal estiver aberto
    if (showProviderManagement) {
      return;
    }

    // Atualização automática a cada 30 segundos
    const revenueInterval = setInterval(() => {
      loadRevenueStats();
    }, 30000);

    // Cleanup do interval
    return () => {
      clearInterval(revenueInterval);
    };
  }, [showProviderManagement]);

  // Load integration data when modal opens
  useEffect(() => {
    if (showIntegrationsModal) {
      loadIntegrationTypes();
      loadProviderIntegrations();
    }
  }, [showIntegrationsModal]);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllProviders(response.data);
      setFilteredProviders(response.data);
    } catch (error) {
      toast.error("Erro ao carregar provedores");
    }
  };

  const loadRevenueStats = async () => {
    try {
      setLoadingRevenue(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/revenue-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenueStats(response.data);
      toast.success("Estatísticas de receita atualizadas com sucesso!");
    } catch (error) {
      console.log("Erro ao carregar estatísticas de receita:", error);
      toast.error("Erro ao atualizar estatísticas de receita");
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleSearchProviders = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredProviders(allProviders);
      return;
    }

    const searchLower = term.toLowerCase().trim();
    const filtered = allProviders.filter((provider) => {
      // Remove formatting from CNPJ for search
      const cnpjNumbers = provider.cnpj.replace(/[^\d]/g, '');
      const searchNumbers = searchLower.replace(/[^\d]/g, '');
      
      return (
        provider.email.toLowerCase().includes(searchLower) ||
        provider.cnpj.toLowerCase().includes(searchLower) ||
        cnpjNumbers.includes(searchNumbers) ||
        provider.name.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredProviders(filtered);
  };

  const handleViewProviderClients = async (providerId, providerName) => {
    setLoadingClients(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/providers/${providerId}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedProviderClients(response.data);
      setShowClientsModal(true);
    } catch (error) {
      toast.error("Erro ao carregar clientes: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setLoadingClients(false);
    }
  };

  // Integration functions

  const loadIntegrationTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/integrations/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrationTypes(response.data.integration_types);
    } catch (error) {
      console.error("Erro ao carregar tipos de integração:", error);
      toast.error("Erro ao carregar tipos de integração");
    }
  };

  const loadProviderIntegrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviderIntegrations(response.data.integrations);
    } catch (error) {
      console.error("Erro ao carregar integrações:", error);
      toast.error("Erro ao carregar integrações");
    }
  };

  const handleCreateIntegration = async () => {
    if (!selectedIntegrationType || !integrationForm.display_name || !integrationForm.api_url) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validate required credentials based on integration type
    const requiredFields = selectedIntegrationType.required_fields;
    for (const field of requiredFields) {
      if (field !== 'api_url' && !integrationForm.credentials[field]) {
        toast.error(`Campo obrigatório não preenchido: ${field}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const integrationData = {
        integration_type: selectedIntegrationType.id,
        display_name: integrationForm.display_name,
        api_url: integrationForm.api_url,
        credentials: integrationForm.credentials,
        settings: integrationForm.settings || {
          debt_days_threshold: 5,
          debt_amount_min: 50
        }
      };

      await axios.post(`${API}/provider/integrations`, integrationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ Integração ${selectedIntegrationType.display_name} configurada com sucesso!`);
      
      // Reset form and reload data
      setSelectedIntegrationType(null);
      setIntegrationForm({
        display_name: '',
        api_url: '',
        credentials: {},
        settings: {}
      });
      
      loadProviderIntegrations();
      
    } catch (error) {
      console.error("Erro ao criar integração:", error);
      toast.error("❌ " + (error.response?.data?.detail || "Erro desconhecido ao configurar integração"));
    }
  };

  const handleTestConnection = async (integrationId) => {
    setTestingConnection(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/integrations/${integrationId}/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("✅ " + response.data.message);
      } else {
        toast.error("❌ " + response.data.message);
      }
      
      loadProviderIntegrations(); // Reload to show updated status
      
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast.error("Erro ao testar conexão: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncData = async (integrationId) => {
    setSyncingData(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/integrations/${integrationId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`✅ Sincronização concluída! ${response.data.clients_synced} clientes importados`);
        
        // Reload clients to show newly synced data
        loadClients();
      } else {
        toast.error("❌ " + response.data.message);
      }
      
      loadProviderIntegrations(); // Reload to show updated status
      
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
      toast.error("Erro na sincronização: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setSyncingData(false);
    }
  };

  // Notification management functions
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error("Erro ao carregar notificações: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!notificationForm.message.trim()) {
      toast.error("Mensagem é obrigatória");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const notificationData = {
        message: notificationForm.message.trim(),
        scheduled_for: notificationForm.scheduled_for || null
      };

      const response = await axios.post(`${API}/admin/notifications`, notificationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Notificação enviada para todos os provedores!");
      
      setShowNotificationModal(false);
      setNotificationForm({
        message: '',
        scheduled_for: ''
      });
      
      loadNotifications();
      
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      toast.error("Erro ao criar notificação: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  // Função simplificada - não precisa de edição no sistema simples
  const handleEditNotification = (notification) => {
    toast.info("Para alterar uma notificação, crie uma nova. O sistema foi simplificado.");
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Tem certeza que deseja remover esta notificação?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Notificação removida com sucesso!");
      loadNotifications();
    } catch (error) {
      toast.error("Erro ao remover notificação: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      message: '',
      scheduled_for: ''
    });
    setEditingNotification(null);
    setShowNotificationModal(false);
  };

  // Load notifications on mount - now handled in main useEffect above

  // Database management functions
  const loadDatabaseStats = async () => {
    setLoadingDatabaseStats(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/database/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDatabaseStats(response.data.stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas do banco:", error);
    } finally {
      setLoadingDatabaseStats(false);
    }
  };

  const clearDatabase = async (type) => {
    const confirmMessages = {
      'providers': 'ATENÇÃO: Esta ação irá remover TODOS os provedores do sistema. Esta ação é IRREVERSÍVEL!\n\nTem certeza que deseja continuar?',
      'clients': 'ATENÇÃO: Esta ação irá remover TODOS os clientes do sistema. Esta ação é IRREVERSÍVEL!\n\nTem certeza que deseja continuar?',
      'subscriptions': 'ATENÇÃO: Esta ação irá remover TODAS as assinaturas do sistema. Esta ação é IRREVERSÍVEL!\n\nTem certeza que deseja continuar?',
      'notifications': 'Esta ação irá remover todas as notificações do sistema. Tem certeza?',
      'all': '🚨 PERIGO EXTREMO 🚨\n\nEsta ação irá APAGAR TODO O BANCO DE DADOS!\nTodos os provedores, clientes, assinaturas e dados serão PERMANENTEMENTE PERDIDOS!\n\nEsta ação é IRREVERSÍVEL e não pode ser desfeita!\n\nTem ABSOLUTA CERTEZA que deseja continuar?'
    };

    const secondConfirmMessages = {
      'all': 'ÚLTIMA CONFIRMAÇÃO:\n\nVocê está prestes a DESTRUIR TODOS OS DADOS do sistema!\n\nDigite "CONFIRMAR EXCLUSÃO" para continuar:'
    };

    // Primeira confirmação
    if (!window.confirm(confirmMessages[type])) {
      return;
    }

    // Segunda confirmação para operações críticas
    if (type === 'all') {
      const userInput = prompt(secondConfirmMessages[type]);
      if (userInput !== 'CONFIRMAR EXCLUSÃO') {
        toast.error('Operação cancelada - confirmação incorreta');
        return;
      }
    }

    setClearingDatabase(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/admin/database/clear-${type}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        loadDatabaseStats();
        loadProviders();
      }
    } catch (error) {
      toast.error("Erro ao limpar banco: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setClearingDatabase(false);
    }
  };

  const handleClearCollection = async (collection) => {
    if (!window.confirm(`Tem certeza que deseja limpar a coleção "${collection}"? Esta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/admin/database/clear-collection`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { collection_name: collection }
      });
      
      toast.success(`Coleção "${collection}" limpa com sucesso!`);
      loadDatabaseStats(); // Recarregar estatísticas
    } catch (error) {
      toast.error("Erro ao limpar coleção: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  // Função para gerar e baixar backup do banco de dados
  const handleGenerateBackup = async () => {
    setGeneratingBackup(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/database/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Criar arquivo JSON para download
      const backupData = response.data;
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Criar nome do arquivo com data/hora
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `controleisp-backup-${timestamp}.json`;
      
      // Download automático
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Backup gerado e baixado: ${filename}`);
      
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      toast.error("Erro ao gerar backup: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setGeneratingBackup(false);
    }
  };

  // Função para restaurar backup do banco de dados
  const handleRestoreBackup = async () => {
    if (!selectedBackupFile) {
      toast.error("Selecione um arquivo de backup primeiro");
      return;
    }

    // Primeira confirmação
    const firstConfirmation = window.confirm(
      "🚨 ATENÇÃO: OPERAÇÃO EXTREMAMENTE PERIGOSA! 🚨\n\n" +
      "Esta ação irá SUBSTITUIR COMPLETAMENTE todo o banco de dados atual!\n\n" +
      "TODOS os dados atuais serão PERMANENTEMENTE PERDIDOS:\n" +
      "• Todos os provedores\n" +
      "• Todos os clientes\n" +
      "• Todas as assinaturas\n" +
      "• Todas as notificações\n\n" +
      "Esta operação é IRREVERSÍVEL!\n\n" +
      "Tem ABSOLUTA CERTEZA que deseja continuar?"
    );

    if (!firstConfirmation) {
      toast.info("Operação de restauração cancelada");
      return;
    }

    // Segunda confirmação com texto específico
    const confirmationText = prompt(
      "Para confirmar esta operação IRREVERSÍVEL, digite exatamente:\nRESTAURAR BACKUP AGORA\n\n" +
      "⚠️ Lembre-se: todos os dados atuais serão perdidos!"
    );

    if (confirmationText !== "RESTAURAR BACKUP AGORA") {
      if (confirmationText === null) {
        toast.info("Operação de restauração cancelada");
      } else {
        toast.warning("Texto incorreto. Operação cancelada por segurança.");
      }
      return;
    }

    setRestoringBackup(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', selectedBackupFile);

      const response = await axios.post(`${API}/admin/database/restore`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const results = response.data.restore_details;
      let successMessage = "Backup restaurado com sucesso!\n\n";
      
      // Mostrar detalhes da restauração
      Object.keys(results.results).forEach(collection => {
        const result = results.results[collection];
        successMessage += `${collection}: ${result.inserted} registros inseridos\n`;
      });

      toast.success(successMessage);
      
      // Recarregar estatísticas do banco
      loadDatabaseStats();
      
      // Limpar arquivo selecionado
      setSelectedBackupFile(null);
      
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      toast.error("Erro ao restaurar backup: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setRestoringBackup(false);
    }
  };

  // Funções do sistema de pagamentos - REMOVIDAS (sistema não é mais gratuito)

  // Provider management functions

  // Função para verificar validade do token
  const checkTokenValidity = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado. Faça login novamente.");
      return false;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp <= currentTime) {
        toast.error("Token expirado. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
        return false;
      }
      return true;
    } catch (error) {
      toast.error("Token inválido. Faça login novamente.");
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("userName");
      return false;
    }
  };

  const handleBlockProvider = async (providerId) => {
    if (!checkTokenValidity()) {
      return;
    }

    if (!window.confirm("Tem certeza que deseja bloquear este provedor?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const reason = prompt("Motivo do bloqueio (opcional):");
      
      await axios.post(`${API}/admin/providers/${providerId}/block`, {
        reason: reason || "Bloqueado pelo administrador"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Provedor bloqueado com sucesso!");
      loadProviders();
    } catch (error) {
      console.error("Erro ao bloquear provedor:", error);
      if (error.response?.status === 401) {
        toast.error("Token inválido. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
      } else {
        toast.error("Erro ao bloquear provedor: " + (error.response?.data?.detail || "Erro desconhecido"));
      }
    }
  };

  const handleUnblockProvider = async (providerId) => {
    if (!checkTokenValidity()) {
      return;
    }

    if (!window.confirm("Tem certeza que deseja desbloquear este provedor?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      await axios.post(`${API}/admin/providers/${providerId}/unblock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Provedor desbloqueado com sucesso!");
      loadProviders();
    } catch (error) {
      console.error("Erro ao desbloquear provedor:", error);
      if (error.response?.status === 401) {
        toast.error("Token inválido. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
      } else {
        toast.error("Erro ao desbloquear provedor: " + (error.response?.data?.detail || "Erro desconhecido"));
      }
    }
  };

  const handleRenewSubscription = async (providerId, providerName) => {
    if (!checkTokenValidity()) {
      return;
    }

    const confirmMessage = `Renovar assinatura de "${providerName}" por mais 30 dias?\n\nEsta ação irá:\n• Reativar a assinatura\n• Definir nova data de expiração (30 dias)\n• Permitir acesso total ao sistema`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      await axios.post(`${API}/admin/providers/${providerId}/renew-subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Assinatura de "${providerName}" renovada com sucesso por 30 dias!`);
      loadProviders();
    } catch (error) {
      console.error("Erro ao renovar assinatura:", error);
      if (error.response?.status === 401) {
        toast.error("Token inválido. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
      } else {
        toast.error("Erro ao renovar assinatura: " + (error.response?.data?.detail || "Erro desconhecido"));
      }
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!checkTokenValidity()) {
      return;
    }

    if (!window.confirm("Tem certeza que deseja EXCLUIR PERMANENTEMENTE este provedor? Esta ação não pode ser desfeita!")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      await axios.delete(`${API}/admin/providers/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Provedor excluído com sucesso!");
      loadProviders();
    } catch (error) {
      console.error("Erro ao excluir provedor:", error);
      if (error.response?.status === 401) {
        toast.error("Token inválido. Faça login novamente.");
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        localStorage.removeItem("userName");
      } else {
        toast.error("Erro ao excluir provedor: " + (error.response?.data?.detail || "Erro desconhecido"));
      }
    }
  };

  const handleWhatsAppCharge = (provider) => {
    const message = `🚨 *ATENÇÃO ${provider.name.toUpperCase()}* 🚨

Sua conta no *ControleIsp* está *BLOQUEADA* por falta de pagamento da mensalidade.

📋 *DADOS DA SUA CONTA:*
• Nome: ${provider.name}
• CNPJ: ${provider.cnpj}
• Email: ${provider.email}

💰 *VALOR EM ABERTO:* R$ 99,00/mês

⚠️ *CONSEQUÊNCIAS DO BLOQUEIO:*
• ❌ Não consegue acessar o sistema
• ❌ Não pode cadastrar novos clientes
• ❌ Perde acesso às pesquisas cruzadas
• ❌ Não recebe atualizações de inadimplentes

🎯 *PARA REATIVAR SUA CONTA:*
1️⃣ Efetue o pagamento da mensalidade
2️⃣ Envie o comprovante por WhatsApp
3️⃣ Sua conta será desbloqueada em até 2 horas

💡 *QUER CONTINUAR NA NOSSA BASE?*
O ControleIsp é essencial para proteger seu negócio contra prejuízos. Não perca essa ferramenta importante!

📞 *Responda este WhatsApp para regularizar sua situação.*

⏰ _Mensagem enviada automaticamente pelo sistema ControleIsp_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/55${provider.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
    toast.success("WhatsApp aberto com mensagem de cobrança!");
  };

  // Modal fullscreen para gestão de provedores usando React Portal
  const ProviderManagementModal = () => {
    if (!showProviderManagement) return null;
    
    const modalContent = (
      <div key="provider-management-modal" className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="bg-gray-700 px-6 py-4 flex items-center justify-between shadow-md">
            <h1 className="text-xl font-bold text-white">Gestão de Provedores</h1>
            <button
              onClick={() => setShowProviderManagement(false)}
              className="px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100 font-medium"
            >
              ← Voltar ao Dashboard
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <AdminProviderDashboardSimple key="admin-provider-dashboard" />
          </div>
        </div>
      </div>
    );
    
    return createPortal(modalContent, document.body);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-controleisp.jpg"
                alt="ControleIsp"
                className="w-10 h-10 rounded-lg shadow-md object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ControleIsp</h1>
                <p className="text-xs text-gray-600">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão de Gestão de Provedores */}
              <Button 
                onClick={() => setShowProviderManagement(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Provedores
              </Button>
              
              {/* Botão de Notificações */}
              <Button 
                onClick={() => setShowNotificationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificações
              </Button>
              
              {/* Botão de Gerenciamento do Banco */}
              <Button 
                onClick={() => setShowDatabaseModal(true)}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Database className="w-4 h-4 mr-2" />
                Banco de Dados
              </Button>
              
              <Button 
                onClick={onLogout} 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card de Receita Reorganizado */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Estatísticas de Receita</h3>
                    <p className="text-green-100 text-sm">Dados atualizados em tempo real</p>
                  </div>
                </div>
                
                {/* Botão de Atualizar no Header */}
                <Button
                  onClick={loadRevenueStats}
                  disabled={loadingRevenue}
                  className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white border border-white border-opacity-30 transition-all duration-200 disabled:opacity-50"
                  size="sm"
                >
                  <svg className={`w-4 h-4 mr-2 ${loadingRevenue ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingRevenue ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
            
            {/* Conteúdo do Card */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total de Provedores */}
                <div className="text-center md:text-left">
                  <div className="rounded-lg p-4 border bg-green-50 border-green-200">
                    <div className="text-sm font-medium mb-2 text-green-600">
                      Total de Provedores
                    </div>
                    <div className="text-3xl font-bold mb-2 text-green-700">
                      {allProviders?.length || 0}
                    </div>
                    <button
                      onClick={() => setShowProviderManagement(true)}
                      className="w-full text-xs bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Gerenciar Provedores</span>
                    </button>
                  </div>
                </div>
                
                {/* Receita Total */}
                <div className="text-center md:text-left">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-600 mb-1">Receita Total</div>
                    <div className="text-2xl font-bold text-blue-700">
                      R$ {revenueStats.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Desde o início</div>
                  </div>
                </div>
                
                {/* Receita Mensal */}
                <div className="text-center md:text-left">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-sm font-medium text-purple-600 mb-1">Receita Mensal</div>
                    <div className="text-2xl font-bold text-purple-700">
                      R$ {revenueStats.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">Últimos 30 dias</div>
                  </div>
                </div>
                
                {/* Assinantes Ativos */}
                <div className="text-center md:text-left">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-medium text-gray-600 mb-1">Assinantes</div>
                    <div className="text-2xl font-bold text-gray-700">
                      {revenueStats.active_subscriptions}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Contas ativas</div>
                  </div>
                </div>
                
              </div>
              
              {/* Informações Adicionais */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{revenueStats.total_subscriptions || 0}</div>
                    <div>Total Assinaturas</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      R$ {revenueStats.average_per_subscription ? revenueStats.average_per_subscription.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                    </div>
                    <div>Valor Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{revenueStats.monthly_subscription_count || 0}</div>
                    <div>Pagamentos/Mês</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">R$ 99,00</div>
                    <div>Valor Mensal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Provedores</h2>
          <p className="text-gray-600">Gerencie os provedores de internet cadastrados no sistema</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <Users className="w-4 h-4 mr-2" />
            {filteredProviders.length} de {allProviders.length} Provedores
          </Badge>
          
          {/* Campo de Pesquisa */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => handleSearchProviders(e.target.value)}
                className="pl-10 w-full border-gray-300 focus:border-red-500 focus:ring-red-500"
                data-testid="provider-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchProviders("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50">
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Clientes Negativos</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id} data-testid={`provider-row-${provider.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium">{provider.nome_fantasia || provider.name}</div>
                          <div className="text-xs text-gray-600">{provider.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {provider.address}{provider.bairro && `, ${provider.bairro}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{provider.cnpj}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {provider.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {provider.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{provider.username}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        {provider.clients_count > 0 ? (
                          <div className="space-y-1">
                            <Button
                              onClick={() => handleViewProviderClients(provider.id, provider.name)}
                              variant="outline"
                              size="sm"
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 w-full"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              {provider.clients_count} {provider.clients_count === 1 ? 'Cliente' : 'Clientes'}
                            </Button>
                            <div className="text-xs text-gray-600">
                              R$ {provider.total_debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">Nenhum cliente</div>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Nova coluna de Assinatura */}
                    <TableCell>
                      <div className="text-center">
                        {provider.subscription_status === 'promotional' ? (
                          <div className="space-y-1">
                            <Badge className="bg-green-100 text-green-700 font-medium">
                              🎉 EM TESTE
                            </Badge>
                            <div className="text-xs text-green-600 font-medium">
                              {provider.days_remaining > 0 
                                ? `${provider.days_remaining} dias restantes`
                                : 'Expirado'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              Período gratuito
                            </div>
                          </div>
                        ) : provider.subscription_status === 'active' ? (
                          <div className="space-y-1">
                            <Badge className="bg-blue-100 text-blue-700 font-medium">
                              💰 PAGANDO
                            </Badge>
                            <div className="text-xs text-blue-600">
                              {provider.days_remaining > 0 
                                ? `${provider.days_remaining} dias restantes`
                                : 'Válida'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              R$ 99,00/mês
                            </div>
                          </div>
                        ) : provider.subscription_status === 'expired' ? (
                          <div className="space-y-1">
                            <Badge className="bg-red-100 text-red-700 font-medium">
                              ⚠️ EXPIRADA
                            </Badge>
                            <div className="text-xs text-red-600">
                              Renovação necessária
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge className="bg-gray-100 text-gray-700">
                              📝 SEM ASSINATURA
                            </Badge>
                            <div className="text-xs text-gray-500">
                              Aguardando ativação
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(provider.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={provider.is_blocked ? "destructive" : "default"}
                        className={provider.is_blocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
                      >
                        {provider.is_blocked ? "Bloqueado" : "Ativo"}
                      </Badge>
                      {provider.is_blocked && provider.blocked_reason && (
                        <div className="text-xs text-gray-500 mt-1">
                          {provider.blocked_reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {provider.is_blocked ? (
                          <>
                            <Button
                              onClick={() => handleWhatsAppCharge(provider)}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white w-full flex items-center justify-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Cobrar WhatsApp
                            </Button>
                            <Button
                              onClick={() => handleUnblockProvider(provider.id)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                            >
                              Desbloquear
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleBlockProvider(provider.id)}
                            size="sm"
                            variant="outline" 
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 w-full"
                          >
                            Bloquear
                          </Button>
                        )}
                        
                        {/* Botão para renovar assinatura expirada */}
                        {provider.subscription_status === 'expired' && (
                          <Button
                            onClick={() => handleRenewSubscription(provider.id, provider.name)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Renovar Assinatura
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleDeleteProvider(provider.id)}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProviders.length === 0 && searchTerm && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-400" />
                        <p>Nenhum provedor encontrado para "{searchTerm}"</p>
                        <button 
                          onClick={() => handleSearchProviders("")}
                          className="text-red-600 hover:text-red-700 text-sm underline"
                        >
                          Limpar pesquisa
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {allProviders.length === 0 && !searchTerm && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum provedor cadastrado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Modal de Detalhes dos Clientes */}
      <Dialog open={showClientsModal} onOpenChange={setShowClientsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Clientes de {selectedProviderClients?.provider_name}
            </DialogTitle>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
              <span>{selectedProviderClients?.total_clients} clientes negativos</span>
              <span className="font-semibold text-red-600">
                Total: R$ {selectedProviderClients?.total_debt?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </DialogHeader>

          {loadingClients ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Carregando clientes...</p>
              </div>
            </div>
          ) : selectedProviderClients ? (
            <div className="overflow-y-auto max-h-96">
              {selectedProviderClients.clients.length > 0 ? (
                <div className="space-y-3">
                  {selectedProviderClients.clients.map((client) => (
                    <Card key={client.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Informações do Cliente */}
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{client.name}</h3>
                                <p className="text-sm text-gray-600 font-mono">{client.cpf}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= client.risk_level
                                        ? 'text-red-500 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="truncate">{client.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-500" />
                                <span>{client.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 col-span-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>Incluído em {new Date(client.inclusion_date).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Informações Financeiras */}
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="text-center">
                              <p className="text-sm text-red-700 font-medium mb-1">Valor em Aberto</p>
                              <p className="text-xl font-bold text-red-700">
                                R$ {client.debt_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                {Math.floor((new Date() - new Date(client.inclusion_date)) / (1000 * 60 * 60 * 24))} dias
                              </p>
                            </div>
                            <div className="mt-2 text-xs text-red-700 bg-red-100 rounded p-2">
                              <p className="font-medium mb-1">Motivo:</p>
                              <p>{client.inclusion_reason}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Este provedor não possui clientes negativos</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de Notificação Urgente removido - movido para ProviderDashboard */}
      
      {/* Rodapé */}
      <footer className="text-gray-700 py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-medium">Desenvolvido para Provedores de Internet em Todo o Brasil | Todos os Direitos Reservados</p>
            <p className="text-xs text-gray-600">© 2025 ControleIsp</p>
          </div>
        </div>
      </footer>
      
      {/* Modal de Gerenciamento de Notificações */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-blue-600">
              📢 Gerenciar Notificações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Formulário de Criação/Edição */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingNotification ? '✏️ Editar Notificação' : '➕ Nova Notificação'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification-message">Mensagem para os Provedores *</Label>
                  <Textarea
                    id="notification-message"
                    className="w-full min-h-[120px]"
                    placeholder="Digite a mensagem que será exibida para todos os provedores..."
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📢 Esta mensagem aparecerá automaticamente na tela de todos os provedores
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="notification-scheduled">Agendar para Data/Hora Específica (Opcional)</Label>
                  <input
                    id="notification-scheduled"
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-md"
                    value={notificationForm.scheduled_for}
                    onChange={(e) => setNotificationForm({...notificationForm, scheduled_for: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⏰ Deixe vazio para enviar imediatamente. Se preenchido, a notificação aparecerá apenas após este horário.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleCreateNotification}
                  disabled={!notificationForm.message.trim()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Enviar para Todos os Provedores
                </Button>
                
                <Button
                  onClick={resetNotificationForm}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
            
            {/* Lista de Notificações Existentes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">📋 Notificações Ativas</h3>
                <Button
                  onClick={loadNotifications}
                  disabled={loadingNotifications}
                  size="sm"
                  variant="outline"
                >
                  {loadingNotifications ? "Carregando..." : "Atualizar"}
                </Button>
              </div>
              
              {notifications.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="bg-white p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">
                              {notification.type === 'info' && 'ℹ️'}
                              {notification.type === 'warning' && '⚠️'}
                              {notification.type === 'maintenance' && '🔧'}
                              {notification.type === 'promotion' && '🎉'}
                            </span>
                            <h4 className="font-semibold">{notification.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              notification.priority === 'low' ? 'bg-green-100 text-green-800' :
                              notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {notification.priority === 'low' && '🟢 Baixa'}
                              {notification.priority === 'normal' && '🔵 Normal'}
                              {notification.priority === 'high' && '🟠 Alta'}
                              {notification.priority === 'urgent' && '🔴 Urgente'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                          
                          {/* Estatísticas de Confirmação */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-bold text-green-600">{notification.read_count || 0}</div>
                                <div className="text-gray-500">✅ Confirmaram</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-red-600">{notification.unread_count || 0}</div>
                                <div className="text-gray-500">❌ Pendentes</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{notification.total_providers || 0}</div>
                                <div className="text-gray-500">👥 Total</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-purple-600">
                                  {notification.total_providers > 0 ? Math.round((notification.read_count || 0) / notification.total_providers * 100) : 0}%
                                </div>
                                <div className="text-gray-500">📊 Taxa</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Lista de Provedores que Confirmaram */}
                          {notification.read_by_providers && notification.read_by_providers.length > 0 && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-600 font-medium mb-1">✅ Confirmaram a leitura:</div>
                              <div className="flex flex-wrap gap-1">
                                {notification.read_by_providers.map((provider, index) => (
                                  <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {provider.provider_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>📅 {new Date(notification.created_at).toLocaleDateString('pt-BR')}</span>
                            {notification.expires_at && (
                              <span>⏰ Expira: {new Date(notification.expires_at).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditNotification(notification)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            onClick={() => handleDeleteNotification(notification.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>Nenhuma notificação criada ainda</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Gerenciamento do Banco de Dados */}
      <Dialog open={showDatabaseModal} onOpenChange={setShowDatabaseModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-orange-600">
              🗄️ Gerenciamento do Banco de Dados
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Aviso de Segurança */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">⚠️ Área Perigosa</h3>
                  <p className="text-sm text-red-700 mt-1">
                    As operações abaixo são <strong>irreversíveis</strong> e podem causar perda permanente de dados. 
                    Use apenas se souber exatamente o que está fazendo.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Estatísticas do Banco */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Estatísticas Atuais do Banco
              </h3>
              
              {loadingDatabaseStats ? (
                <p className="text-gray-600">Carregando estatísticas...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{databaseStats.providers || 0}</div>
                    <div className="text-sm text-gray-600">Provedores</div>
                    <div className="text-xs text-green-600">Ativos: {databaseStats.active_providers || 0}</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-purple-600">{databaseStats.clients || 0}</div>
                    <div className="text-sm text-gray-600">Clientes</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-green-600">{databaseStats.subscriptions || 0}</div>
                    <div className="text-sm text-gray-600">Assinaturas</div>
                    <div className="text-xs text-green-600">Pagas: {databaseStats.active_subscriptions || 0}</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-orange-600">{databaseStats.notifications || 0}</div>
                    <div className="text-sm text-gray-600">Notificações</div>
                  </div>
                </div>
              )}
              
              <div className="mt-3 flex gap-2">
                <Button 
                  onClick={loadDatabaseStats}
                  disabled={loadingDatabaseStats}
                  size="sm"
                  variant="outline"
                >
                  {loadingDatabaseStats ? "Carregando..." : "Atualizar"}
                </Button>
              </div>
            </div>
            
            {/* Backup do Banco de Dados */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Backup do Banco de Dados
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-green-700">
                  Gere um backup completo do banco de dados em formato JSON. O arquivo será baixado automaticamente.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateBackup}
                    disabled={generatingBackup}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {generatingBackup ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Gerando Backup...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        💾 Salvar Banco de Dados
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-green-600">
                  💡 O backup inclui: provedores, clientes, notificações, lembretes de pagamento e configurações.
                </div>
              </div>
            </div>
            
            {/* Restaurar Backup do Banco de Dados */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                Restaurar Backup do Banco de Dados
              </h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-800">⚠️ OPERAÇÃO PERIGOSA</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Restaurar um backup irá <strong>SOBRESCREVER COMPLETAMENTE</strong> todos os dados atuais do banco. 
                    Esta operação é <strong>IRREVERSÍVEL</strong>!
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar arquivo de backup (.json)
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => setSelectedBackupFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {selectedBackupFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Arquivo selecionado: {selectedBackupFile.name}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleRestoreBackup}
                    disabled={restoringBackup || !selectedBackupFile}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  >
                    {restoringBackup ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Restaurando Backup...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        🔄 Restaurar Banco de Dados
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-orange-600">
                  💡 Use apenas backups gerados por este sistema. Certifique-se de que o arquivo JSON está íntegro.
                </div>
              </div>
            </div>
            
            {/* Operações de Limpeza */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">🧹 Operações de Limpeza</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Limpar Provedores */}
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Limpar Provedores</h4>
                      <p className="text-sm text-gray-600">Remove todos os provedores do sistema</p>
                    </div>
                    <Building2 className="w-6 h-6 text-red-500" />
                  </div>
                  <Button
                    onClick={() => clearDatabase('providers')}
                    disabled={clearingDatabase}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {clearingDatabase ? "Removendo..." : `Remover ${databaseStats.providers || 0} provedores`}
                  </Button>
                </div>
                
                {/* Limpar Clientes */}
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Limpar Clientes</h4>
                      <p className="text-sm text-gray-600">Remove todos os clientes do sistema</p>
                    </div>
                    <Users className="w-6 h-6 text-red-500" />
                  </div>
                  <Button
                    onClick={() => clearDatabase('clients')}
                    disabled={clearingDatabase}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {clearingDatabase ? "Removendo..." : `Remover ${databaseStats.clients || 0} clientes`}
                  </Button>
                </div>
                
                {/* Limpar Assinaturas */}
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Limpar Assinaturas</h4>
                      <p className="text-sm text-gray-600">Remove todas as assinaturas do sistema</p>
                    </div>
                    <DollarSign className="w-6 h-6 text-red-500" />
                  </div>
                  <Button
                    onClick={() => clearDatabase('subscriptions')}
                    disabled={clearingDatabase}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {clearingDatabase ? "Removendo..." : `Remover ${databaseStats.subscriptions || 0} assinaturas`}
                  </Button>
                </div>
                
                {/* Limpar Notificações */}
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Limpar Notificações</h4>
                      <p className="text-sm text-gray-600">Remove todas as notificações do sistema</p>
                    </div>
                    <Bell className="w-6 h-6 text-red-500" />
                  </div>
                  <Button
                    onClick={() => clearDatabase('notifications')}
                    disabled={clearingDatabase}
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {clearingDatabase ? "Removendo..." : `Remover ${databaseStats.notifications || 0} notificações`}
                  </Button>
                </div>
              </div>
              
              {/* Operação Extrema */}
              <div className="border-2 border-red-500 bg-red-50 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h4 className="font-bold text-red-800">🚨 OPERAÇÃO EXTREMAMENTE PERIGOSA 🚨</h4>
                    <p className="text-sm text-red-700">Esta operação é IRREVERSÍVEL e remove TODOS os dados!</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => clearDatabase('all')}
                  disabled={clearingDatabase}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {clearingDatabase ? "REMOVENDO TUDO..." : "🗑️ APAGAR TODO O BANCO DE DADOS"}
                </Button>
              </div>
              
              {/* Informações de Uso */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">💡 Quando Usar:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Limpar Provedores:</strong> Quando há conflitos de cadastro ou dados corrompidos</li>
                  <li>• <strong>Limpar Clientes:</strong> Para resetar a base de clientes negativados</li>
                  <li>• <strong>Limpar Assinaturas:</strong> Para resetar histórico de pagamentos</li>
                  <li>• <strong>Apagar Tudo:</strong> Apenas para resetar completamente o ambiente</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Limpeza de Dados Órfãos removido */}
      
      {/* Modal de Gestão de Provedores */}
      <ProviderManagementModal />
    </div>
  );
};

// Provider Dashboard
const ProviderDashboard = ({ onLogout }) => {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [providerInfo, setProviderInfo] = useState({ name: "", cnpj: "" });
  
  // Cross-provider search states
  const [nameSearch, setNameSearch] = useState("");
  const [cpfSearch, setCpfSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [crossProviderResults, setCrossProviderResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    address: "",
    bairro: "",
    // house_number removido
    cep: "",
    city: "",
    state: "",
    debt_amount: "",
    inclusion_reason: "",
    inclusion_date: new Date().toISOString().split('T')[0], // Data atual como padrão
    observations: "",
    risk_level: 1
  });

  // Payment states
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Financial modal states
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [myPayments, setMyPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [processingBulkAction, setProcessingBulkAction] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // First login / terms modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  // Edit phone states
  const [showEditPhone, setShowEditPhone] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newPhone, setNewPhone] = useState("");

  // Edit debt states
  const [showEditDebt, setShowEditDebt] = useState(false);
  const [editingDebtClient, setEditingDebtClient] = useState(null);
  const [newDebt, setNewDebt] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  
  // Edit notes states
  const [showEditNotes, setShowEditNotes] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [providerLogo, setProviderLogo] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Image crop states
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Payment reminder states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderClient, setReminderClient] = useState(null);
  const [reminderData, setReminderData] = useState({
    reminder_date: "",
    amount: "",
    notes: ""
  });
  const [clientReminders, setClientReminders] = useState({});

  // CPF validation states
  const [cpfCheckStatus, setCpfCheckStatus] = useState(null); // null, 'checking', 'available', 'exists'
  const [existingClientInfo, setExistingClientInfo] = useState(null);

  // Estados de logo removidos - gerenciado no cadastro
  const [downloadingContract, setDownloadingContract] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Estados para pesquisa de meus clientes
  const [showMyClientsSearch, setShowMyClientsSearch] = useState(false);
  const [myClientsSearchName, setMyClientsSearchName] = useState("");
  const [myClientsResults, setMyClientsResults] = useState([]);
  const [loadingMyClients, setLoadingMyClients] = useState(false);

  // Estados para gerenciar PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState({
    chave_pix: "",
    titular: "",
    banco: ""
  });
  const [pixQrCodeFile, setPixQrCodeFile] = useState(null);
  const [pixQrCodePreview, setPixQrCodePreview] = useState(null);
  const [currentPixInfo, setCurrentPixInfo] = useState(null);
  const [loadingPixUpdate, setLoadingPixUpdate] = useState(false);

  // Estados para sistema de agendamentos profissional
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Estados para notificação simples
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Estados para integrações ERP
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [integrationTypes, setIntegrationTypes] = useState([]);
  const [providerIntegrations, setProviderIntegrations] = useState([]);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    display_name: '',
    api_url: '',
    credentials: {},
    settings: {
      debt_days_threshold: 5,
      debt_amount_min: 50
    }
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingData, setSyncingData] = useState(false);

  useEffect(() => {
    // Configurar interceptor do axios para tratar tokens expirados globalmente
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || 
            error.response?.data?.detail?.includes("Invalid token") || 
            error.response?.data?.detail?.includes("Token expired")) {
          
          // Só mostrar toast se não há outro toast similar ativo
          if (!document.querySelector('[data-sonner-toast]')) {
            toast.error("Sua sessão expirou. Redirecionando para login...");
          }
          
          // Limpar dados e redirecionar para login
          localStorage.removeItem("token");
          setTimeout(() => {
            setIsLoggedIn(false);
            setUserType("");
            setCurrentUser(null);
          }, 1500);
        }
        return Promise.reject(error);
      }
    );

    loadClients();
    // checkPaymentStatus(); - DESABILITADO (pagamento agora via Efi Bank)
    loadProviderInfo();
    loadMyPayments(); // Carregar pagamentos e status de bloqueio
    loadClientReminders();
    loadProviderLogo();
    loadProviderNotifications();
    loadScheduledReminders(); // Carregar agendamentos automaticamente
    loadIntegrationTypes();
    loadProviderIntegrations();

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check localStorage for financial_generated on mount
  useEffect(() => {
    const checkFinancialGenerated = () => {
      const financialGenerated = localStorage.getItem("financial_generated");
      const dueDay = localStorage.getItem("due_day");
      
      // Show modal if financial NOT generated (regardless of terms_accepted)
      if (financialGenerated === "false" && dueDay && dueDay !== "null") {
        console.log("🔍 Provedor sem financeiro gerado - Mostrando tela de bloqueio!");
        console.log("   financial_generated:", financialGenerated);
        console.log("   due_day:", dueDay);
        setShowTermsModal(true);
        
        // Store due_day in providerInfo for display
        setProviderInfo(prev => ({
          ...prev,
          due_day: parseInt(dueDay)
        }));
      }
    };
    
    // Small delay to ensure other useEffects have run
    setTimeout(checkFinancialGenerated, 100);
  }, []);

  // Auto-check payment status - DESABILITADO (pagamento via Efi Bank)
  // useEffect(() => {
  //   let interval;
  //   if (showPayment && paymentStatus?.qr_code) {
  //     interval = setInterval(() => {
  //       checkPaymentStatus();
  //     }, 30000);
  //   }
  //   return () => {
  //     if (interval) clearInterval(interval);
  //   };
  // }, [showPayment, paymentStatus?.qr_code]);

  const loadClients = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Carregar todos os clientes (ativos e inativos) para ter o total correto
      const allClientsResponse = await axios.get(`${API}/provider/clients/all`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null); // Se endpoint não existir, usar apenas ativos
      
      // Carregar clientes ativos (endpoint atual)
      const activeClientsResponse = await axios.get(`${API}/provider/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Definir clientes ativos
      setClients(activeClientsResponse.data);
      
      // Se conseguiu carregar todos os clientes, usar essa lista, senão usar apenas ativos
      setAllClients(allClientsResponse?.data || activeClientsResponse.data);
      
    } catch (error) {
      // If 402 (payment required), show payment modal
      if (error.response?.status === 401 || error.response?.data?.detail?.includes("Invalid token")) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserType("");
        setCurrentUser(null);
        return;
      } else if (error.response?.status === 402) {
        // Pagamento agora é gerenciado via Efi Bank pelo admin
        toast.error("Sua conta está com pagamento pendente. Acesse 'Meu Financeiro' para pagar.");
      } else {
        toast.error("Erro ao carregar clientes");
      }
    }
  };

  const loadProviderInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setProviderInfo({ name: "Provedor", cnpj: "N/A" });
        return;
      }

      // Fetch full provider info from API
      const response = await axios.get(`${API}/provider/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const provider = response.data.provider;
        setProviderInfo({
          name: provider.name || "Provedor",
          nome_fantasia: provider.nome_fantasia || provider.name || "Provedor",
          cnpj: provider.cnpj || "N/A",
          email: provider.email || "",
          phone: provider.phone || "",
          logo_url: provider.logo_url
        });
        
        // Check if financial not generated
        if (!provider.financial_generated && provider.due_day) {
          console.log("🔍 Provedor sem financeiro (via API) - Mostrando tela!");
          setShowTermsModal(true);
        }
        
        // Store in localStorage for later use
        if (provider.due_day) {
          localStorage.setItem("due_day", provider.due_day);
        }
        if (provider.financial_generated !== undefined) {
          localStorage.setItem("financial_generated", provider.financial_generated);
        }
        
        // Set logo if exists
        if (provider.logo_url) {
          setProviderLogo(provider.logo_url);
        }
      }
    } catch (error) {
      console.log("Erro ao carregar informações do provedor:", error);
      // Fallback to JWT data
      try {
        const token = localStorage.getItem("token");
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setProviderInfo({
          name: tokenData.name || tokenData.username || "Provedor",
          cnpj: tokenData.cnpj || "N/A"
        });
      } catch {
        setProviderInfo({
          name: "Provedor",
          cnpj: "N/A"
        });
      }
    }
  };

  // Carregar pagamentos do provedor
  const loadMyPayments = async () => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/my-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPayments(response.data.payments || []);
      setIsBlocked(response.data.is_blocked || false);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      setMyPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Funções para seleção múltipla de parcelas
  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handleSelectAllPayments = () => {
    if (selectedPayments.length === myPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(myPayments.map(p => p.id));
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedPayments.length === 0) {
      toast.error("Selecione pelo menos uma parcela");
      return;
    }

    if (!window.confirm(`Deseja marcar ${selectedPayments.length} parcela(s) como RECEBIDA?`)) {
      return;
    }

    try {
      setProcessingBulkAction(true);
      const token = localStorage.getItem("token");
      
      // Marcar cada parcela selecionada como paga
      for (const paymentId of selectedPayments) {
        await axios.put(`${API}/provider/payments/${paymentId}/status`, 
          { status: 'paid' },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
      
      toast.success(`${selectedPayments.length} parcela(s) marcada(s) como recebida!`);
      setSelectedPayments([]);
      loadMyPayments();
    } catch (error) {
      toast.error("Erro ao atualizar parcelas: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setProcessingBulkAction(false);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedPayments.length === 0) {
      toast.error("Selecione pelo menos uma parcela");
      return;
    }

    if (!window.confirm(`Deseja CANCELAR ${selectedPayments.length} parcela(s)?`)) {
      return;
    }

    try {
      setProcessingBulkAction(true);
      const token = localStorage.getItem("token");
      
      // Cancelar cada parcela selecionada
      for (const paymentId of selectedPayments) {
        await axios.delete(`${API}/provider/payments/${paymentId}`, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
      
      toast.success(`${selectedPayments.length} parcela(s) cancelada(s)!`);
      setSelectedPayments([]);
      loadMyPayments();
    } catch (error) {
      toast.error("Erro ao cancelar parcelas: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setProcessingBulkAction(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      setAcceptingTerms(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/accept-terms`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Close modal
        setShowTermsModal(false);
        
        // Update localStorage to reflect terms accepted and financial generated
        localStorage.setItem("terms_accepted", "true");
        localStorage.setItem("financial_generated", "true");
        
        // Show success with confetti effect
        toast.success('🎉 Bem-vindo ao ControleIsp!', { duration: 3000 });
        
        // Show details about generated payments
        if (response.data.payments_generated) {
          setTimeout(() => {
            toast.success(
              `✅ ${response.data.payments_generated} parcelas geradas com sucesso!\n💰 Total: R$ ${response.data.total_amount?.toFixed(2)}\n📅 Primeira cobrança: ${new Date(response.data.first_due_date).toLocaleDateString('pt-BR')}`,
              { duration: 6000 }
            );
          }, 500);
          
          // Show welcome message
          setTimeout(() => {
            toast.success(
              '🚀 Seu sistema está pronto! Comece cadastrando seus clientes negativados.',
              { duration: 5000 }
            );
          }, 2000);
        }
        
        // Reload everything to show the system is now accessible
        await loadMyPayments();
        await loadClients();
        await loadProviderInfo();
      }
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
      toast.error("Erro ao aceitar termos: " + (error.response?.data?.detail || error.message));
      setAcceptingTerms(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    
    // Verificar se token existe e é válido
    const token = localStorage.getItem("token");
    if (!token || !isTokenValid(token)) {
      toast.error("Sua sessão expirou. Redirecionando para login...");
      localStorage.removeItem("token");
      setTimeout(() => {
        setIsLoggedIn(false);
        setUserType("");
        setCurrentUser(null);
      }, 1500);
      return;
    }

    try {
      const clientData = {
        ...newClient,
        debt_amount: parseFloat(newClient.debt_amount),
        risk_level: newClient.risk_level
      };
      
      const response = await axios.post(`${API}/provider/clients`, clientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Cliente adicionado com sucesso!");
        setShowCreateClient(false);
        setNewClient({
          name: "",
          cpf: "",
          email: "",
          phone: "",
          address: "",
          bairro: "",
          // house_number removido
          cep: "",
          city: "",
          state: "",
          debt_amount: "",
          inclusion_reason: "",
          inclusion_date: new Date().toISOString().split('T')[0], // Reset para data atual
          observations: "",
          risk_level: 1
        });
        loadClients();
      }
    } catch (error) {
      // Verificar se é erro de token expirado
      if (error.response?.status === 401 || error.response?.data?.detail?.includes("Invalid token")) {
        toast.error("Sua sessão expirou. Redirecionando para login...");
        localStorage.removeItem("token");
        setTimeout(() => {
          setIsLoggedIn(false);
          setUserType("");
          setCurrentUser(null);
        }, 1500);
        return;
      }
      
      toast.error("Erro ao adicionar cliente: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewClient({
      ...newClient,
      [name]: type === 'checkbox' ? checked : value
    });

    // Check CPF when it's modified
    if (name === 'cpf' && value.length >= 11) {
      checkCpfExists(value);
    } else if (name === 'cpf' && value.length < 11) {
      setCpfCheckStatus(null);
      setExistingClientInfo(null);
    }
  };

  const handleCpfBlur = async (cpf) => {
    if (cpf && cpf.length >= 11) {
      try {
        const response = await axios.post(`${API}/validate/cpf`, { cpf });
        if (response.data.success) {
          setNewClient(prev => ({
            ...prev,
            cpf: response.data.formatted
          }));
          toast.success("CPF validado e formatado!");
        } else if (response.data.error) {
          toast.error(`CPF: ${response.data.error}`);
        }
      } catch (error) {
        toast.error("Erro na validação do CPF");
      }
    }
  };

  const handleClientCepBlur = async (cep) => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      try {
        const response = await axios.post(`${API}/validate/cep`, { cep });
        if (response.data.success) {
          const data = response.data;
          setNewClient(prev => ({
            ...prev,
            cep: data.cep,
            address: data.logradouro || prev.address,
            bairro: data.bairro || prev.bairro,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success("Endereço carregado automaticamente pelo CEP!");
        } else if (response.data.error) {
          toast.error(`CEP: ${response.data.error}`);
        }
      } catch (error) {
        toast.error("Erro na consulta do CEP");
      }
    }
  };

  // Função removida - agora usamos pesquisa cruzada

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewClient({
          ...newClient,
          [field]: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleWhatsAppCharge = async (clientId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/clients/${clientId}/whatsapp-charge`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Abrir WhatsApp com a mensagem personalizada
        window.open(response.data.whatsapp_url, '_blank');
        toast.success(`Mensagem de cobrança gerada para ${response.data.client_name}!`);
      }
    } catch (error) {
      // Verificar se é erro de token inválido/expirado
      if (error.response?.status === 401 || error.response?.data?.detail?.includes("Invalid token")) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserType("");
        setCurrentUser(null);
        return;
      }
      
      toast.error("Erro ao gerar mensagem de cobrança: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const handleDeleteClient = async (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const confirmDelete = window.confirm(
      `Confirma que o cliente ${client.name} realizou o pagamento e deve ser removido da lista de negativados?`
    );
    
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API}/provider/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success(`Cliente ${client.name} removido com sucesso!`);
        loadClients(); // Recarregar lista
      } catch (error) {
        toast.error("Erro ao remover cliente: " + (error.response?.data?.detail || "Erro desconhecido"));
      }
    }
  };

  const handleEditPhone = (client) => {
    setEditingClient(client);
    setNewPhone(client.phone);
    setShowEditPhone(true);
  };

  const handleSavePhone = async () => {
    if (!editingClient || !newPhone.trim()) {
      toast.error("Telefone não pode estar vazio");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`${API}/provider/clients/${editingClient.id}/phone`, {
        phone: newPhone.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Telefone do cliente ${editingClient.name} atualizado com sucesso!`);
      
      // Atualizar a lista local
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === editingClient.id 
            ? { ...client, phone: newPhone.trim() }
            : client
        )
      );
      setAllClients(prevClients => 
        prevClients.map(client => 
          client.id === editingClient.id 
            ? { ...client, phone: newPhone.trim() }
            : client
        )
      );

      // Fechar modal
      setShowEditPhone(false);
      setEditingClient(null);
      setNewPhone("");

    } catch (error) {
      toast.error("Erro ao atualizar telefone: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const handleCancelEditPhone = () => {
    setShowEditPhone(false);
    setEditingClient(null);
    setNewPhone("");
  };

  
  const handleEditDebt = (client) => {
    setEditingDebtClient(client);
    setNewDebt(client.debt_amount.toString());
    setDebtNotes(client.provider_notes || "");
    setShowEditDebt(true);
  };

  const handleSaveDebt = async () => {
    if (!editingDebtClient || !newDebt.trim()) {
      toast.error("Valor da dívida não pode estar vazio");
      return;
    }

    const debtValue = parseFloat(newDebt);
    if (isNaN(debtValue) || debtValue < 0) {
      toast.error("Valor da dívida inválido");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`${API}/provider/clients/${editingDebtClient.id}/debt`, {
        debt_amount: debtValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Valor da dívida do cliente ${editingDebtClient.name} atualizado com sucesso!`);
      
      // Atualizar a lista local
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === editingDebtClient.id 
            ? { ...client, debt_amount: debtValue }
            : client
        )
      );
      setAllClients(prevClients => 
        prevClients.map(client => 
          client.id === editingDebtClient.id 
            ? { ...client, debt_amount: debtValue }
            : client
        )
      );

      // Fechar modal
      setShowEditDebt(false);
      setEditingDebtClient(null);
      setNewDebt("");

    } catch (error) {
      toast.error("Erro ao atualizar valor da dívida: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  // Handle logo file selection
  const handleLogoFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB');
      return;
    }

    // Close profile modal first to avoid conflicts
    setShowProfileModal(false);

    // Read file and open crop modal with delay
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        setImageSrc(reader.result);
        setShowImageCrop(true);
      }, 300);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Handle crop complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;
    
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
    });
  };

  // Handle logo upload with cropped image
  const handleLogoUpload = async () => {
    setUploadingLogo(true);

    try {
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) {
        toast.error('Erro ao processar imagem');
        return;
      }

      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', croppedBlob, 'logo.jpg');

      const response = await axios.post(`${API}/provider/logo/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProviderLogo(response.data.logo_url);
        // Update provider info with new logo
        setProviderInfo(prev => ({
          ...prev,
          logo_url: response.data.logo_url
        }));
        toast.success('Logo atualizada com sucesso!');
        setShowImageCrop(false);
        setImageSrc(null);
        
        // Reopen profile modal after a short delay
        setTimeout(() => {
          setShowProfileModal(true);
        }, 300);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCancelEditDebt = () => {
    setShowEditDebt(false);
    setEditingDebtClient(null);
    setNewDebt("");
    setDebtNotes("");
  };

  const handleSaveNotes = async () => {
    if (!editingDebtClient) {
      toast.error("Erro ao identificar cliente");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`${API}/provider/clients/${editingDebtClient.id}/debt`, {
        debt_amount: editingDebtClient.debt_amount,
        provider_notes: debtNotes.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Observações do cliente ${editingDebtClient.name} atualizadas com sucesso!`);
      
      // Atualizar a lista local
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === editingDebtClient.id 
            ? { ...client, provider_notes: debtNotes.trim() }
            : client
        )
      );
      setAllClients(prevClients => 
        prevClients.map(client => 
          client.id === editingDebtClient.id 
            ? { ...client, provider_notes: debtNotes.trim() }
            : client
        )
      );

      // Fechar modal
      setShowEditNotes(false);
      setEditingDebtClient(null);
      setDebtNotes("");

    } catch (error) {
      toast.error("Erro ao atualizar observações: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API}/provider/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Perfil atualizado com sucesso!');
        // Update local provider info
        setProviderInfo(prev => ({
          ...prev,
          email: profileData.email || prev.email,
          phone: profileData.phone || prev.phone
        }));
        setEditingProfile(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API}/provider/password`, {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Senha atualizada com sucesso!');
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
        setShowPasswordFields(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar senha');
    }
  };

  // Open profile modal and load current data
  const handleOpenProfileModal = () => {
    setProfileData({
      email: providerInfo.email || '',
      phone: providerInfo.phone || ''
    });
    setShowProfileModal(true);
  };


  // Cross-provider search functions
  const searchByName = async () => {
    if (!nameSearch.trim() || nameSearch.trim().length < 3) {
      toast.warning("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/search/clients/name`, {
        search_term: nameSearch.trim(),
        search_type: "name"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCrossProviderResults(response.data);
      if (response.data.length === 0) {
        toast.info("Nenhum cliente encontrado com esse nome");
      } else {
        toast.success(`${response.data.length} cliente(s) encontrado(s)`);
      }
    } catch (error) {
      toast.error("Erro na pesquisa: " + (error.response?.data?.detail || "Erro desconhecido"));
      setCrossProviderResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchByCpf = async () => {
    if (!cpfSearch.trim()) {
      toast.warning("CPF é obrigatório");
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/search/clients/cpf`, {
        search_term: cpfSearch.trim(),
        search_type: "cpf"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCrossProviderResults(response.data);
      if (response.data.length === 0) {
        toast.info("Nenhum cliente encontrado com esse CPF");
      } else {
        toast.success(`Cliente encontrado!`);
      }
    } catch (error) {
      toast.error("Erro na pesquisa: " + (error.response?.data?.detail || "Erro desconhecido"));
      setCrossProviderResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchByAddress = async () => {
    if (!addressSearch.trim() || addressSearch.trim().length < 5) {
      toast.warning("Endereço deve ter pelo menos 5 caracteres");
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/search/clients/address`, {
        search_term: addressSearch.trim(),
        search_type: "address"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCrossProviderResults(response.data);
      if (response.data.length === 0) {
        toast.info("Nenhum cliente encontrado nesse endereço");
      } else {
        toast.success(`${response.data.length} cliente(s) encontrado(s)`);
      }
    } catch (error) {
      toast.error("Erro na pesquisa: " + (error.response?.data?.detail || "Erro desconhecido"));
      setCrossProviderResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearAllSearches = () => {
    setNameSearch("");
    setCpfSearch("");
    setAddressSearch("");
    setCrossProviderResults([]);
  };

  // Notification functions
  const loadProviderNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notifications = response.data.notifications || [];
      setNotifications(notifications);
      setUnreadCount(response.data.unread_count || 0);
      
      // Verificar se há alguma notificação não lida
      const unreadNotification = notifications.find(notification => 
        !notification.is_read && notification.is_active
      );
      
      if (unreadNotification) {
        setCurrentNotification(unreadNotification);
        setShowNotificationAlert(true);
      }
      
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/provider/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        Array.isArray(prev) ? prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ) : []
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/provider/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: true })) : []
      );
      setUnreadCount(0);
      toast.success("Todas as notificações foram marcadas como lidas!");
      setShowNotifications(false);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Erro ao marcar notificações como lidas");
    }
  };

  // Função para pesquisar meus clientes por nome
  const searchMyClients = async () => {
    if (!myClientsSearchName.trim()) {
      toast.warning("Digite o nome do cliente para pesquisar");
      return;
    }

    setLoadingMyClients(true);
    try {
      // Filtrar apenas os clientes do provedor atual pelo nome
      const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(myClientsSearchName.toLowerCase())
      );
      
      setMyClientsResults(filteredClients);
      
      if (filteredClients.length === 0) {
        toast.info("Nenhum cliente encontrado com esse nome");
      } else {
        toast.success(`${filteredClients.length} cliente(s) encontrado(s)`);
      }
      
    } catch (error) {
      toast.error("Erro ao pesquisar clientes: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setLoadingMyClients(false);
    }
  };

  const clearMyClientsSearch = () => {
    setMyClientsSearchName("");
    setMyClientsResults([]);
  };

  // Função para verificar se o token ainda é válido
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      // Decodificar o payload do JWT (sem verificar assinatura - só para checar expiração)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar se o token não expirou (com margem de 1 minuto)
      return payload.exp && payload.exp > (currentTime + 60);
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  };

  // Função simples para marcar notificação como lida
  const markCurrentNotificationAsRead = async () => {
    if (!currentNotification) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/provider/notifications/${currentNotification.id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fechar modal
      setShowNotificationAlert(false);
      setCurrentNotification(null);
      
      // Atualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success("Notificação confirmada!");
      
      // Recarregar notificações
      loadProviderNotifications();
      
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast.error("Erro ao confirmar notificação");
    }
  };

  // Funções do sistema de agendamentos profissional
  const loadScheduledReminders = async () => {
    setLoadingReminders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const reminders = Array.isArray(response.data) ? response.data : [];
      setScheduledReminders(reminders);
      
      if (reminders.length === 0) {
        console.log("Nenhum agendamento encontrado");
      } else {
        console.log(`${reminders.length} agendamentos carregados com sucesso`);
      }
      
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      
      // Verificar se é erro de token inválido/expirado
      if (error.response?.status === 401 || error.response?.data?.detail?.includes("Invalid token")) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserType("");
        setCurrentUser(null);
        return;
      }
      
      let errorMessage = "Erro ao carregar agendamentos";
      if (error.response?.status === 402) {
        errorMessage = "Assinatura expirada. Renove para acessar agendamentos.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setScheduledReminders([]); // Set empty array on error
    } finally {
      setLoadingReminders(false);
    }
  };

  const sendScheduledReminder = async (reminder) => {
    setSendingReminder(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.post(`${API}/provider/reminders/${reminder.id}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Abrir WhatsApp automaticamente com a mensagem gerada (igual ao botão normal)
        if (response.data.whatsapp_url) {
          window.open(response.data.whatsapp_url, '_blank');
          toast.success(`Mensagem de cobrança gerada para ${reminder.client_name || 'cliente'}!`);
        } else {
          toast.success("Cobrança enviada com sucesso!");
        }
        
        // Atualizar status do lembrete
        setScheduledReminders(prev => 
          prev.map(r => 
            r.id === reminder.id 
              ? { ...r, status: 'sent', sent_at: new Date().toISOString() }
              : r
          )
        );
        
        // Atualizar também na lista de clientes se existir
        loadClientReminders();
      }
    } catch (error) {
      console.error("Erro ao enviar cobrança:", error);
      
      // Verificar se é erro de token inválido/expirado
      if (error.response?.status === 401 || error.response?.data?.detail?.includes("Invalid token")) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserType("");
        setCurrentUser(null);
        return;
      }
      
      toast.error("Erro ao enviar cobrança: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setSendingReminder(false);
    }
  };

  // Integration functions
  const loadIntegrationTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/integrations/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrationTypes(response.data.integration_types);
    } catch (error) {
      console.error("Erro ao carregar tipos de integração:", error);
      toast.error("Erro ao carregar tipos de integração");
    }
  };

  const loadProviderIntegrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviderIntegrations(response.data.integrations);
    } catch (error) {
      console.error("Erro ao carregar integrações:", error);
      toast.error("Erro ao carregar integrações");
    }
  };

  const handleCreateIntegration = async () => {
    if (!selectedIntegrationType || !integrationForm.display_name || !integrationForm.api_url) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validate required credentials based on integration type
    const requiredFields = selectedIntegrationType.required_fields;
    for (const field of requiredFields) {
      if (field !== 'api_url' && !integrationForm.credentials[field]) {
        toast.error(`Campo obrigatório não preenchido: ${field}`);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const integrationData = {
        integration_type: selectedIntegrationType.id,
        display_name: integrationForm.display_name,
        api_url: integrationForm.api_url,
        credentials: integrationForm.credentials,
        settings: integrationForm.settings || {
          debt_days_threshold: 5,
          debt_amount_min: 50
        }
      };

      await axios.post(`${API}/provider/integrations`, integrationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ Integração ${selectedIntegrationType.display_name} configurada com sucesso!`);
      
      // Reset form and reload data
      setSelectedIntegrationType(null);
      setIntegrationForm({
        display_name: '',
        api_url: '',
        credentials: {},
        settings: {
          debt_days_threshold: 5,
          debt_amount_min: 50
        }
      });
      
      loadProviderIntegrations();
      
    } catch (error) {
      console.error("Erro ao criar integração:", error);
      toast.error("❌ " + (error.response?.data?.detail || "Erro desconhecido ao configurar integração"));
    }
  };

  const handleTestConnection = async (integrationId) => {
    setTestingConnection(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/integrations/${integrationId}/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
      
      loadProviderIntegrations(); // Reload to show updated status
      
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast.error("Erro ao testar conexão: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncData = async (integrationId) => {
    setSyncingData(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/integrations/${integrationId}/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`✅ Sincronização concluída! ${response.data.clients_synced} clientes novos importados, ${response.data.clients_updated || 0} atualizados`);
        
        // Reload clients to show newly synced data
        loadClients();
      } else {
        toast.error("❌ " + response.data.message);
      }
      
      loadProviderIntegrations(); // Reload to show updated status
      
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
      toast.error("Erro na sincronização: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setSyncingData(false);
    }
  };

 

  const handleDeleteIntegration = async (integrationId, integrationName) => {
    const confirmed = window.confirm(`Tem certeza que deseja remover a integração ${integrationName}?\n\nIsso não irá deletar os clientes já importados.`);
    
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API}/provider/integrations/${integrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        loadProviderIntegrations(); // Reload list
      }
      
    } catch (error) {
      console.error("Erro ao deletar integração:", error);
      toast.error("Erro ao remover integração: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const handleUpdateMinDays = async (integrationId, minDays) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API}/provider/integrations/${integrationId}/auto-sync`,
        {
          min_days_overdue: minDays
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`✅ Dias de atraso mínimo atualizado para ${minDays} dias`);
        loadProviderIntegrations();
      }
      
    } catch (error) {
      console.error("Erro ao atualizar dias:", error);
      toast.error("Erro ao atualizar: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  const handleToggleAutoSync = async (integrationId, enabled, time, minDays) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API}/provider/integrations/${integrationId}/auto-sync`,
        {
          auto_sync_enabled: enabled,
          auto_sync_time: time,
          min_days_overdue: minDays
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(enabled 
          ? `✅ Sincronização automática ativada para ${time}` 
          : '⏸️ Sincronização automática desativada'
        );
        loadProviderIntegrations(); // Reload to show updated settings
      }
      
    } catch (error) {
      console.error("Erro ao atualizar auto-sync:", error);
      toast.error("Erro ao atualizar configurações: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };


  // Load integration data when modal opens
  useEffect(() => {
    if (showIntegrationsModal) {
      loadIntegrationTypes();
      loadProviderIntegrations();
    }
  }, [showIntegrationsModal]);

  const markReminderAsPaid = async (reminder) => {
    // Temporarily disable this feature until backend endpoint is created
    toast.info("Funcionalidade em desenvolvimento. Por enquanto, delete o lembrete quando o pagamento for confirmado.");
    
    /*
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.put(`${API}/provider/reminders/${reminder.id}`, {
        status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Pagamento confirmado!");
        
        // Atualizar status do lembrete
        setScheduledReminders(prev => 
          prev.map(r => 
            r.id === reminder.id 
              ? { ...r, status: 'paid', paid_at: new Date().toISOString() }
              : r
          )
        );
        
        loadClientReminders();
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
      toast.error("Erro ao confirmar pagamento");
    }
    */
  };

  const deleteScheduledReminder = async (reminder) => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      await axios.delete(`${API}/provider/reminders/${reminder.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Agendamento cancelado!");
      setScheduledReminders(prev => prev.filter(r => r.id !== reminder.id));
      loadClientReminders();
      
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const handleSendTodayReminders = async () => {
    try {
      // Carregar lembretes se não estiverem carregados
      if (scheduledReminders.length === 0) {
        await loadScheduledReminders();
      }

      // Filtrar lembretes de hoje que ainda não foram enviados
      const today = new Date().toISOString().split('T')[0];
      const todayReminders = scheduledReminders.filter(reminder => 
        reminder.status === 'scheduled' && 
        reminder.reminder_date === today
      );

      if (todayReminders.length === 0) {
        toast.info("Não há agendamentos para enviar hoje");
        return;
      }

      if (!window.confirm(`Enviar ${todayReminders.length} cobrança(s) agendada(s) para hoje?\n\n📱 O WhatsApp será aberto automaticamente para cada cliente.`)) {
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Enviar cada lembrete
      for (const reminder of todayReminders) {
        try {
          await sendScheduledReminder(reminder);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error("Erro ao enviar lembrete:", error);
        }
        
        // Pequena pausa entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (successCount > 0) {
        toast.success(`${successCount} cobrança(s) enviada(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} cobrança(s) falharam no envio`);
      }

    } catch (error) {
      console.error("Erro ao enviar lembretes do dia:", error);
      toast.error("Erro ao processar lembretes de hoje");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'sent': return 'Enviado';
      case 'paid': return 'Pago';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'sent': return <MessageCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Payment Reminder Functions
  const handleSchedulePayment = (client) => {
    setReminderClient(client);
    setReminderData({
      reminder_date: "",
      amount: client.debt_amount || "",
      notes: ""
    });
    setShowReminderModal(true);
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    if (!reminderData.reminder_date || !reminderData.amount) {
      toast.warning("Data e valor são obrigatórios");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/clients/${reminderClient.id}/reminder`, {
        client_id: reminderClient.id,
        reminder_date: reminderData.reminder_date,
        amount: parseFloat(reminderData.amount),
        notes: reminderData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Lembrete de pagamento criado com sucesso!");
        setShowReminderModal(false);
        loadClientReminders();
        
        // Update client reminders in state
        setClientReminders(prev => ({
          ...prev,
          [reminderClient.id]: [...(prev[reminderClient.id] || []), response.data.reminder]
        }));
      }
    } catch (error) {
      console.error("Erro ao criar lembrete:", error);
      let errorMessage = "Erro desconhecido";
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      }
      
      toast.error("Erro ao criar lembrete: " + errorMessage);
    }
  };

  const loadClientReminders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if response.data is an array
      const reminders = Array.isArray(response.data) ? response.data : [];
      
      // Group reminders by client_id
      const remindersByClient = {};
      reminders.forEach(reminder => {
        if (!remindersByClient[reminder.client_id]) {
          remindersByClient[reminder.client_id] = [];
        }
        remindersByClient[reminder.client_id].push(reminder);
      });

      setClientReminders(remindersByClient);
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      // Don't show error toast for loading reminders to avoid spam
    }
  };

  const sendReminderWhatsApp = async (reminderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/provider/reminders/${reminderId}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const whatsappUrl = `https://wa.me/55${response.data.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(response.data.message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success("WhatsApp aberto com mensagem de lembrete!");
        loadClientReminders(); // Refresh to show as sent
      }
    } catch (error) {
      toast.error("Erro ao enviar lembrete: " + (error.response?.data?.detail || "Erro desconhecido"));
    }
  };

  // CPF validation function
  const checkCpfExists = async (cpf) => {
    if (!cpf || cpf.length < 11) {
      setCpfCheckStatus(null);
      setExistingClientInfo(null);
      return;
    }

    setCpfCheckStatus('checking');
    
    try {
      // Check if CPF exists by trying to search for it in current provider's clients
      const existingClient = clients.find(client => client.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''));
      
      if (existingClient) {
        setCpfCheckStatus('exists');
        setExistingClientInfo(existingClient);
      } else {
        setCpfCheckStatus('available');
        setExistingClientInfo(null);
      }
    } catch (error) {
      setCpfCheckStatus(null);
      setExistingClientInfo(null);
    }
  };

  // Função para construir URL absoluta da imagem
  const buildImageUrl = (logoUrl) => {
    if (!logoUrl) return null;
    
    // Se já é uma URL absoluta, retorna como está
    if (logoUrl.startsWith('http')) {
      return logoUrl;
    }
    
    // Se a URL começa com /uploads, constroi URL absoluta usando BACKEND_URL
    if (logoUrl.startsWith('/uploads/')) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      return `${backendUrl}${logoUrl}`;
    }
    
    // Caso contrário, retorna a URL como está (para casos especiais)
    return logoUrl;
  };

  // Logo management functions
  const loadProviderLogo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/provider/logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.logo_url) {
        setProviderLogo(response.data.logo_url);
      }
    } catch (error) {
      console.error("Erro ao carregar logo:", error);
    }
  };

  // Funções de logo removidas - gerenciado no cadastro

  const handleDownloadContract = async () => {
    try {
      setDownloadingContract(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API}/provider/contract`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Importante para receber o PDF corretamente
      });
      
      // Criar blob com o PDF
      const blob = new Blob([response.data], { 
        type: 'application/pdf' 
      });
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extrair filename do header Content-Disposition se disponível
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Contrato_ControlIsp.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Contrato PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar contrato: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setDownloadingContract(false);
    }
  };

  // Calcular total de dívidas (clientes ativos)
  const totalDebt = clients.reduce((sum, client) => sum + client.debt_amount, 0);
  
  // Calcular negociações bem sucedidas (clientes inativos)
  const negotiatedClients = allClients.filter(client => !client.is_active);
  const negotiatedCount = negotiatedClients.length;
  const negotiatedTotal = negotiatedClients.reduce((sum, client) => sum + (client.debt_amount || 0), 0);

  // Payment functions
  // Função de pagamento antigo (Mercado Pago) - DESABILITADA
  // Agora o pagamento é feito via Efi Bank com boletos gerados pelo admin
  const checkPaymentStatus = async () => {
    // Desabilitado - pagamento agora é via Efi Bank
    return;
  };

  // Função de criação de pagamento antigo - DESABILITADA
  const createPayment = async () => {
    // Desabilitado - pagamento agora é via Efi Bank
    return;
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setPaymentStatus({ ...paymentStatus, is_active: true, show_pix: false });
    toast.success("Pagamento confirmado! Acesso liberado.");
    loadClients();
  };

  const checkPaymentManual = async () => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/payment/check-manual`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        if (response.data.status === "approved") {
          handlePaymentSuccess();
        } else {
          toast.info(response.data.message);
        }
      } else {
        // Show specific error messages based on status
        const message = response.data.message;
        if (message.includes("pendente")) {
          toast.warning("⏳ " + message);
        } else if (message.includes("Rate limit") || message.includes("Aguarde")) {
          toast.error("🚫 " + message);
        } else if (message.includes("não foi aprovado")) {
          toast.error("❌ " + message);
        } else {
          toast.error("⚠️ " + message);
        }
      }
    } catch (error) {
      toast.error("Erro ao verificar pagamento: " + (error.response?.data?.detail || "Erro desconhecido"));
    } finally {
      setPaymentLoading(false);
    }
  };

  // Payment Modal Component - DESABILITADO (pagamento via Efi Bank)
  // const PaymentModal = () => (
  //   <Dialog open={showPayment} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-red-600">
            💳 Renovação da Assinatura
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status da Assinatura */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-red-800 font-semibold mb-2">
              {paymentStatus?.status === "expired" ? "⏰ Assinatura Expirada" : "🔒 Pagamento Necessário"}
            </div>
            <div className="text-sm text-red-600">
              Para continuar usando o ControleIsp, renove sua assinatura mensal
            </div>
          </div>

          {/* Valor */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">R$ 99,00</div>
            <div className="text-gray-600">Mensalidade do Sistema</div>
            <div className="text-sm text-gray-500 mt-2">
              ✅ Gestão ilimitada de clientes<br/>
              ✅ Cobrança via WhatsApp<br/>
              ✅ Relatórios e estatísticas<br/>
              ✅ Suporte técnico incluso
            </div>
          </div>

          {/* PIX QR Code */}
          {paymentStatus?.qr_code_base64 ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="font-semibold text-gray-800 mb-3">📱 Escaneie o QR Code PIX</div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={`data:image/png;base64,${paymentStatus.qr_code_base64}`} 
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>
              
              {/* PIX Code */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Código PIX (Copiar e Colar):</div>
                <div className="bg-gray-100 p-3 rounded border text-xs break-all">
                  {paymentStatus.qr_code}
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentStatus.qr_code);
                    toast.success("Código PIX copiado!");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  📋 Copiar Código PIX
                </Button>
              </div>

              {/* Status Check */}
              <div className="text-center text-sm text-gray-600 space-y-3">
                <p>⏳ Aguardando confirmação do pagamento...</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={checkPaymentStatus}
                    variant="outline"
                    size="sm"
                    disabled={paymentLoading}
                  >
                    🔄 Verificar Status
                  </Button>
                  <Button
                    onClick={checkPaymentManual}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? "Verificando..." : "✅ Já Paguei - Verificar"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Se já pagou, clique em "Já Paguei" para verificar manualmente
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Button
                onClick={createPayment}
                disabled={paymentLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                size="lg"
              >
                {paymentLoading ? "Gerando PIX..." : "🏦 Gerar PIX para Pagamento"}
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Pagamento 100% seguro via Mercado Pago</p>
            <p>⚡ Liberação automática após confirmação</p>
          </div>
        </div>
  //     </DialogContent>
  //   </Dialog>
  // );

  // Logo gerenciado durante o cadastro - modal removido

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-controleisp.jpg"
                alt="ControleIsp"
                className="w-10 h-10 rounded-lg shadow-md object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ControleIsp</h1>
                <p className="text-xs text-gray-600">Painel do Provedor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botão de Notificações */}
              <div className="relative">
                <Button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="outline" 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 relative"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notificações
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* Botão Meu Financeiro */}
              <Button 
                onClick={() => {
                  setShowFinancialModal(true);
                  loadMyPayments();
                }}
                variant="outline" 
                className={`${isBlocked ? 'border-red-500 text-red-600 hover:bg-red-50 animate-pulse' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Meu Financeiro
                {isBlocked && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Bloqueado</span>}
              </Button>
              
              {/* Botão de Perfil */}
              <Button 
                onClick={handleOpenProfileModal}
                variant="outline" 
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Perfil
              </Button>

              {/* Botão de Integrações */}
              <Button 
                onClick={() => setShowIntegrationsModal(true)}
                variant="outline" 
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Integrações
              </Button>
              
              <Button 
                onClick={onLogout} 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Seção de Informações do Provedor */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo do Provedor */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white">
                {providerInfo.logo_url || providerLogo ? (
                  <img 
                    src={providerLogo || providerInfo.logo_url} 
                    alt={providerInfo.nome_fantasia} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {providerInfo.nome_fantasia ? 
                      providerInfo.nome_fantasia.charAt(0).toUpperCase() : 
                    providerInfo.name ? providerInfo.name.charAt(0).toUpperCase() : 'P'
                  }
                  </span>
                )}
              </div>
              
              {/* Informações do Provedor */}
              <div>
                <h3 className="text-xl font-bold text-blue-900">
                  {providerInfo.nome_fantasia || providerInfo.name}
                </h3>
                <p className="text-sm text-blue-700">Razão Social: {providerInfo.name}</p>
                <p className="text-sm text-blue-600">CNPJ: {providerInfo.cnpj}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerta de Bloqueio */}
        {isBlocked && (
          <div className="mb-6 bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-800 rounded-lg shadow-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="bg-white rounded-full p-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  ⚠️ Conta Bloqueada - Pagamento Pendente
                </h3>
                <p className="text-red-100 text-lg mb-4">
                  Você possui parcelas vencidas há mais de 3 dias. Para continuar usando o sistema, regularize seus pagamentos.
                </p>
                <Button 
                  onClick={() => {
                    setShowFinancialModal(true);
                    loadMyPayments();
                  }}
                  className="bg-white text-red-600 hover:bg-red-50 font-bold text-lg px-6 py-3 shadow-lg"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Ver Minhas Faturas e Pagar Agora
                </Button>
                <p className="text-red-100 text-sm mt-3">
                  💡 <strong>Após o pagamento</strong>, seu acesso será liberado automaticamente em até 24 horas.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header Section com Cards de Resumo */}
        <div className="mb-8">
          {/* Título e Descrição */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Painel do Provedor</h2>
            <p className="text-gray-600">Gerencie clientes negativados e controle de débitos</p>
          </div>
          
          {/* 3 Cards lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Clientes Ativos */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="bg-blue-600 p-2.5 rounded-full">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-800">Ativos</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {clients.length}
                  </div>
                  <p className="text-sm text-blue-700">
                    {clients.length === 1 ? 'Cliente ativo' : 'Clientes ativos no sistema'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card 2: Total de Dívidas */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="bg-red-600 p-2.5 rounded-full">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-red-800">Total de Dívidas</h3>
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-red-700">
                    Valor total em aberto
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card 3: Negociações Bem Sucedidas */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="bg-green-600 p-2.5 rounded-full">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800">Negociações</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    R$ {negotiatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-green-700">
                    {negotiatedCount} {negotiatedCount === 1 ? 'negociação bem sucedida' : 'negociações bem sucedidas'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sistema de Agendamentos Profissional */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                📅 Agendamentos de Cobranças
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">Gerencie todos os agendamentos de pagamento dos seus clientes</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
              <Button
                onClick={() => {
                  loadScheduledReminders();
                  setShowScheduleManager(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto text-sm md:text-base"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Todos Agendamentos
              </Button>
              
              <Button
                onClick={() => {
                  // Função para enviar lembretes automáticos dos agendamentos de hoje
                  handleSendTodayReminders();
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto text-sm md:text-base"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Cobranças de Hoje
              </Button>
            </div>
          </div>

          {/* Cards de Agendamentos Resumidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-bold text-yellow-800">Agendados</h4>
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {scheduledReminders.filter(r => r.status === 'scheduled').length}
                </div>
                <p className="text-sm text-yellow-600">Pendentes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-800">Enviados</h4>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {scheduledReminders.filter(r => r.status === 'sent').length}
                </div>
                <p className="text-sm text-blue-600">Cobranças</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-green-800">Pagos</h4>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {scheduledReminders.filter(r => r.status === 'paid').length}
                </div>
                <p className="text-sm text-green-600">Confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-purple-800">Valor Total</h4>
                </div>
                <div className="text-lg font-bold text-purple-700">
                  R$ {scheduledReminders.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-purple-600">Agendado</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Próximos Agendamentos (Top 3) */}
          {scheduledReminders.filter(r => r.status === 'scheduled').slice(0, 3).length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Próximos Agendamentos
              </h4>
              <div className="space-y-2">
                {scheduledReminders.filter(r => r.status === 'scheduled').slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="bg-white rounded-lg p-3 border border-purple-200 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{reminder.client_name}</p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(reminder.reminder_date).toLocaleDateString('pt-BR')} • 
                        💰 R$ {reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {reminder.notes && (
                        <p className="text-xs text-gray-500 mt-1">📝 {reminder.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => sendScheduledReminder(reminder)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={sendingReminder}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {scheduledReminders.filter(r => r.status === 'scheduled').length > 3 && (
                <div className="text-center mt-3">
                  <Button
                    onClick={() => {
                      loadScheduledReminders();
                      setShowScheduleManager(true);
                    }}
                    variant="outline"
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    Ver todos os {scheduledReminders.filter(r => r.status === 'scheduled').length} agendamentos
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Mensagem quando não há agendamentos */}
          {scheduledReminders.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-8 inline-block mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">Nenhum agendamento encontrado</p>
              <p className="text-gray-500 text-sm">Use o botão "Agendar Pagamento" nos cards dos clientes para criar lembretes automáticos</p>
            </div>
          )}
        </div>

        {/* Pesquisa Cruzada de Clientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Botão Novo Cliente - Lado Esquerdo */}
            <div className="flex gap-4">
              {isBlocked ? (
                <div className="relative">
                  <Button 
                    size="lg"
                    disabled
                    className="relative bg-gray-400 cursor-not-allowed text-white shadow-lg px-8 py-4 rounded-lg opacity-60" 
                    data-testid="add-client-button"
                  >
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <span className="text-lg">✨ Novo Cliente</span>
                    </div>
                  </Button>
                  <div className="absolute -top-12 left-0 bg-red-600 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap">
                    ⚠️ Acesso bloqueado - Pague suas faturas em "Meu Financeiro"
                  </div>
                </div>
              ) : (
                <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold border-2 border-red-500 px-8 py-4 rounded-lg" 
                      data-testid="add-client-button"
                    >
                      <div className="flex items-center">
                        <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <span className="text-lg">✨ Novo Cliente</span>
                      </div>
                      {/* Glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-700 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">🔍 Consulta de Clientes Negativados</h3>
              <p className="text-gray-600 text-sm">Verifique se um cliente já está negativado por outros provedores no sistema</p>
            </div>
            
            {/* Modal Novo Cliente */}
            <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
              <DialogTrigger asChild>
                <div></div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Cliente Negativado</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateClient} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={newClient.name}
                        onChange={handleInputChange}
                        required
                        data-testid="client-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        value={newClient.cpf}
                        onChange={handleInputChange}
                        onBlur={(e) => handleCpfBlur(e.target.value)}
                        placeholder="000.000.000-00 (validação automática)"
                        required
                        data-testid="client-cpf-input"
                        className={
                          cpfCheckStatus === 'exists' ? 'border-red-500 bg-red-50' : 
                          cpfCheckStatus === 'available' ? 'border-green-500 bg-green-50' : ''
                        }
                      />
                      
                      {/* CPF Status Indicator */}
                      {cpfCheckStatus === 'checking' && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          Verificando CPF...
                        </p>
                      )}
                      
                      {cpfCheckStatus === 'exists' && existingClientInfo && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 font-semibold mb-1">⚠️ CPF já cadastrado!</p>
                          <p className="text-xs text-red-600">
                            <strong>Cliente:</strong> {existingClientInfo.name}<br/>
                            <strong>Cadastrado em:</strong> {new Date(existingClientInfo.inclusion_date).toLocaleDateString('pt-BR')}<br/>
                            <strong>Dívida:</strong> R$ {parseFloat(existingClientInfo.debt_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      
                      {cpfCheckStatus === 'available' && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          ✅ CPF disponível para cadastro
                        </p>
                      )}
                      
                      {cpfCheckStatus === null && (
                        <p className="text-xs text-gray-600 mt-1">
                          💡 CPF é validado automaticamente
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={newClient.email}
                        onChange={handleInputChange}
                        required
                        data-testid="client-email-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={newClient.phone}
                        onChange={handleInputChange}
                        required
                        data-testid="client-phone-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        name="cep"
                        value={newClient.cep}
                        onChange={handleInputChange}
                        onBlur={(e) => handleClientCepBlur(e.target.value)}
                        placeholder="00000-000 (preenche endereço automaticamente)"
                        required
                        data-testid="client-cep-input"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        💡 Digite o CEP para preencher o endereço
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        name="city"
                        value={newClient.city}
                        onChange={handleInputChange}
                        required
                        data-testid="client-city-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado (UF)</Label>
                      <Input
                        id="state"
                        name="state"
                        value={newClient.state}
                        onChange={handleInputChange}
                        placeholder="UF"
                        maxLength="2"
                        required
                        data-testid="client-state-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={newClient.address}
                        onChange={handleInputChange}
                        placeholder="Rua/Avenida, número, complemento (ex: Rua das Flores, 123)"
                        required
                        data-testid="client-address-input"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        ⚠️ Inclua o número e complementos
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        name="bairro"
                        value={newClient.bairro}
                        onChange={handleInputChange}
                        placeholder="Nome do bairro"
                        required
                        data-testid="client-bairro-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="debt_amount">Valor da Dívida (R$)</Label>
                      <Input
                        id="debt_amount"
                        name="debt_amount"
                        type="number"
                        step="0.01"
                        value={newClient.debt_amount}
                        onChange={handleInputChange}
                        required
                        data-testid="client-debt-amount-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="inclusion_reason">Motivo da Inclusão</Label>
                      <Input
                        id="inclusion_reason"
                        name="inclusion_reason"
                        value={newClient.inclusion_reason}
                        onChange={handleInputChange}
                        placeholder="Ex: Falta de pagamento"
                        required
                        data-testid="client-inclusion-reason-input"
                      />
                    </div>
                  </div>

                  {/* Nível de Risco */}
                  {/* Nova seção - Data da Inclusão */}
                  <div>
                    <Label htmlFor="inclusion_date">Data da Inclusão *</Label>
                    <Input
                      id="inclusion_date"
                      name="inclusion_date"
                      type="date"
                      value={newClient.inclusion_date}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      data-testid="inclusion-date-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📅 Data em que o cliente foi incluído na lista de negativados
                    </p>
                  </div>

                  {/* Nova seção - Observações Finais */}
                  <div>
                    <Label htmlFor="observations">Observações Finais</Label>
                    <textarea
                      id="observations"
                      name="observations"
                      value={newClient.observations}
                      onChange={handleInputChange}
                      placeholder="Informações adicionais sobre o cliente ou a dívida (opcional)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-vertical min-h-[80px]"
                      rows={3}
                      data-testid="observations-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📝 Campo opcional para informações complementares
                    </p>
                  </div>

                  <div>
                    <Label>Nível de Risco *</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewClient(prev => ({ ...prev, risk_level: star }))}
                          className={`p-1 rounded transition-colors ${
                            star <= newClient.risk_level 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                          data-testid={`risk-level-${star}`}
                        >
                          <Star 
                            className="w-8 h-8" 
                            fill={star <= newClient.risk_level ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {newClient.risk_level === 1 && "Risco Muito Baixo"}
                        {newClient.risk_level === 2 && "Risco Baixo"}
                        {newClient.risk_level === 3 && "Risco Médio"}
                        {newClient.risk_level === 4 && "Risco Alto"}
                        {newClient.risk_level === 5 && "Risco Muito Alto"}
                      </span>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p3 mt-3">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">💡 Dica:</span> O nível de risco ajuda outros provedores a entenderem o perfil do cliente.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateClient(false)}
                      data-testid="cancel-client-button"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      data-testid="save-client-button"
                      disabled={cpfCheckStatus === 'exists' || cpfCheckStatus === 'checking'}
                    >
                      {cpfCheckStatus === 'checking' ? 'Verificando...' : 'Adicionar Cliente'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Modal de Integrações */}
            <Dialog open={showIntegrationsModal} onOpenChange={setShowIntegrationsModal}>
              <DialogTrigger asChild>
                <div></div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-600" />
                    Integrações de Sistemas
                  </DialogTitle>
                  <p className="text-gray-600">
                    Configure integrações para importar automaticamente clientes em débito dos seus sistemas
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Integrações Ativas */}
                  {providerIntegrations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Suas Integrações Ativas
                      </h3>
                      
                      <div className="grid gap-4">
                        {providerIntegrations.map(integration => (
                          <div key={integration.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-lg">{integration.display_name}</h4>
                                <p className="text-sm text-gray-600">{integration.integration_type.toUpperCase()}</p>
                                <p className="text-xs text-gray-500">{integration.api_url}</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  integration.last_sync_status === 'success' 
                                    ? 'bg-green-100 text-green-700' 
                                    : integration.last_sync_status === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {integration.last_sync_status === 'success' && '✅ Conectado'}
                                  {integration.last_sync_status === 'error' && '❌ Erro'}
                                  {integration.last_sync_status === 'never' && '⏸️ Nunca testado'}
                                </span>
                              </div>
                            </div>
                            
                            {integration.last_sync && (
                              <p className="text-xs text-gray-500 mb-3">
                                Última sincronização: {new Date(integration.last_sync).toLocaleString('pt-BR')}
                              </p>
                            )}
                            
                            {integration.last_sync_message && (
                              <p className="text-sm mb-3 p-2 bg-white rounded border-l-4 border-blue-500">
                                {integration.last_sync_message}
                              </p>
                            )}
                            
                            {/* Sincronização Automática */}
                            <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-semibold text-gray-900 block">Sincronização Automática</span>
                                    <span className="text-xs text-gray-600">Atualize dados diariamente</span>
                                  </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={integration.auto_sync_enabled || false}
                                    onChange={(e) => handleToggleAutoSync(integration.id, e.target.checked, integration.auto_sync_time || '05:00', integration.min_days_overdue || 60)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                  <span className="ml-2 text-xs font-medium text-gray-700">
                                    {integration.auto_sync_enabled ? 'Ativo' : 'Inativo'}
                                  </span>
                                </label>
                              </div>
                              {integration.auto_sync_enabled && (
                                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm text-gray-700 font-medium">Horário:</span>
                                  <input
                                    type="time"
                                    value={integration.auto_sync_time || '05:00'}
                                    onChange={(e) => handleToggleAutoSync(integration.id, true, e.target.value, integration.min_days_overdue || 60)}
                                    className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <span className="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded">Sincronização diária</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => handleTestConnection(integration.id)}
                                disabled={testingConnection}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                {testingConnection ? (
                                  <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Wifi className="w-4 h-4" />
                                )}
                                Testar Conexão
                              </Button>
                              
                              <Button
                                onClick={() => handleSyncData(integration.id)}
                                disabled={syncingData}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                              >
                                {syncingData ? (
                                  <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                Sincronizar Agora
                              </Button>
                              
                              <Button
                                onClick={() => handleDeleteIntegration(integration.id, integration.display_name)}
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover Integração
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Adicionar Nova Integração */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-600" />
                      Adicionar Nova Integração
                    </h3>
                    
                    {!selectedIntegrationType ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {integrationTypes.map(type => (
                          <div 
                            key={type.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                              type.is_active 
                                ? 'border-blue-200 hover:border-blue-400 bg-white' 
                                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                            }`}
                            onClick={() => {
                              if (type.is_active) {
                                setSelectedIntegrationType(type);
                                setIntegrationForm({
                                  display_name: `${type.display_name} - ${new Date().getFullYear()}`,
                                  api_url: '',
                                  credentials: {}
                                });
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {type.logo_url && (
                                <img src={type.logo_url} alt={type.name} className="w-8 h-8" />
                              )}
                              <h4 className="font-medium">{type.display_name}</h4>
                              {!type.is_active && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Em breve
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-lg">Configurar {selectedIntegrationType.display_name}</h4>
                          <Button
                            onClick={() => setSelectedIntegrationType(null)}
                            size="sm"
                            variant="outline"
                          >
                            Voltar
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Help text específico do sistema */}
                          {selectedIntegrationType.help_text && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                💡 {selectedIntegrationType.help_text}
                              </p>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Nome da Integração *</Label>
                            <Input
                              value={integrationForm.display_name}
                              onChange={(e) => setIntegrationForm(prev => ({
                                ...prev,
                                display_name: e.target.value
                              }))}
                              placeholder={`Ex: ${selectedIntegrationType.display_name} - Provedor Principal`}
                              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500">Nome para identificar esta integração</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">URL da API *</Label>
                            <Input
                              value={integrationForm.api_url}
                              onChange={(e) => setIntegrationForm(prev => ({
                                ...prev,
                                api_url: e.target.value
                              }))}
                              placeholder={
                                selectedIntegrationType.id === 'ixc' 
                                  ? "https://seudominio.com/webservice/v1"
                                  : selectedIntegrationType.id === 'mk-auth'
                                  ? "https://seu-mkauth.com/api"
                                  : selectedIntegrationType.id === 'sgp'
                                  ? "https://seu-sgp.com/api"
                                  : "https://seu-radiusnet.com/api"
                              }
                              className="h-11 font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500">URL completa da API do seu sistema</p>
                          </div>
                          
                          {/* Username field (IXC, RadiusNet) */}
                          {selectedIntegrationType.required_fields.includes('username') && (
                            <div>
                              <Label>Usuário da API *</Label>
                              <Input
                                value={integrationForm.credentials.username || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    username: e.target.value
                                  }
                                }))}
                                placeholder="usuario_admin"
                              />
                              <p className="text-xs text-gray-500 mt-1">Usuário com permissões de API</p>
                            </div>
                          )}
                          
                          {/* Password field (RadiusNet) */}
                          {selectedIntegrationType.required_fields.includes('password') && (
                            <div>
                              <Label>Senha da API *</Label>
                              <Input
                                type="password"
                                value={integrationForm.credentials.password || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    password: e.target.value
                                  }
                                }))}
                                placeholder="••••••••"
                              />
                              <p className="text-xs text-gray-500 mt-1">Senha do usuário da API</p>
                            </div>
                          )}
                          
                          {/* Token field (IXC) */}
                          {selectedIntegrationType.required_fields.includes('token') && (
                            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full filter blur-3xl opacity-20 -z-10"></div>
                              
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                </div>
                                <div>
                                  <Label className="text-lg font-bold text-gray-900 block">Token da API IXC</Label>
                                  <span className="text-sm text-gray-600">Credencial de acesso obrigatória</span>
                                </div>
                              </div>
                              
                              <Input
                                type="text"
                                value={integrationForm.credentials.token || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    token: e.target.value
                                  }
                                }))}
                                placeholder="ID:HASH (ex: 16:2b085ca1ed...)"
                                className="mt-3 font-mono text-sm bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500 h-12 shadow-sm"
                              />
                              
                              <div className="mt-4 bg-white rounded-lg p-4 border-l-4 border-blue-500">
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="text-sm">
                                    <p className="font-semibold text-gray-900 mb-1">Como obter seu token:</p>
                                    <ol className="text-gray-700 space-y-1 list-decimal list-inside">
                                      <li>Acesse o painel IXC</li>
                                      <li>Vá em <span className="font-medium">Configurações → Usuários</span></li>
                                      <li>Marque <span className="font-medium">"Permite acesso a API"</span></li>
                                      <li>Copie o token gerado</li>
                                    </ol>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* API Token field (MK-Auth) */}
                          {selectedIntegrationType.required_fields.includes('api_token') && (
                            <div>
                              <Label>Token da API *</Label>
                              <Input
                                type="password"
                                value={integrationForm.credentials.api_token || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    api_token: e.target.value
                                  }
                                }))}
                                placeholder="seu_token_de_autenticacao"
                              />
                              <p className="text-xs text-gray-500 mt-1">Token de autenticação do MK-Auth</p>
                            </div>
                          )}
                          
                          {/* API Key field (SGP) */}
                          {selectedIntegrationType.required_fields.includes('api_key') && (
                            <div>
                              <Label>API Key *</Label>
                              <Input
                                type="password"
                                value={integrationForm.credentials.api_key || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    api_key: e.target.value
                                  }
                                }))}
                                placeholder="sua_chave_api"
                              />
                              <p className="text-xs text-gray-500 mt-1">Chave de API fornecida pelo SGP</p>
                            </div>
                          )}
                          
                          {/* API Secret field (SGP) */}
                          {selectedIntegrationType.required_fields.includes('api_secret') && (
                            <div>
                              <Label>API Secret *</Label>
                              <Input
                                type="password"
                                value={integrationForm.credentials.api_secret || ''}
                                onChange={(e) => setIntegrationForm(prev => ({
                                  ...prev,
                                  credentials: {
                                    ...prev.credentials,
                                    api_secret: e.target.value
                                  }
                                }))}
                                placeholder="seu_segredo_api"
                              />
                              <p className="text-xs text-gray-500 mt-1">Segredo de API fornecido pelo SGP</p>
                            </div>
                          )}
                          
                          
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                              onClick={() => {
                                setSelectedIntegrationType(null);
                                setIntegrationForm({
                                  display_name: '',
                                  api_url: '',
                                  credentials: {},
                                  settings: {}
                                });
                              }}
                              variant="outline"
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleCreateIntegration}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Configurar Integração
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pesquisa por Nome */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Pesquisa por Nome
              </h4>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && searchByName()}
                />
                <Button
                  onClick={searchByName}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                  disabled={searchLoading || !nameSearch.trim() || nameSearch.trim().length < 3}
                >
                  {searchLoading ? "Buscando..." : "Buscar por Nome"}
                </Button>
              </div>
            </div>

            {/* Pesquisa por CPF */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Pesquisa por CPF
              </h4>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfSearch}
                  onChange={(e) => setCpfSearch(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && searchByCpf()}
                />
                <Button
                  onClick={searchByCpf}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                  disabled={searchLoading || !cpfSearch.trim()}
                >
                  {searchLoading ? "Buscando..." : "Buscar por CPF"}
                </Button>
              </div>
            </div>

            {/* Pesquisa por Endereço */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                Pesquisa por Endereço
              </h4>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Digite o endereço..."
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && searchByAddress()}
                />
                <Button
                  onClick={searchByAddress}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                  disabled={searchLoading || !addressSearch.trim() || addressSearch.trim().length < 5}
                >
                  {searchLoading ? "Buscando..." : "Buscar por Endereço"}
                </Button>
              </div>
            </div>
          </div>

          {/* Botão Limpar */}
          {(nameSearch || cpfSearch || addressSearch || crossProviderResults.length > 0) && (
            <div className="mt-4 text-center">
              <Button
                onClick={clearAllSearches}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                size="sm"
              >
                Limpar todas as pesquisas
              </Button>
            </div>
          )}
        </div>

        {/* Resultados da Pesquisa Cruzada */}
        {crossProviderResults.length > 0 && (
          <div className="mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Atenção: Dados encontrados de outros provedores</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                {crossProviderResults.length} cliente(s) encontrado(s) já negativado(s) por outros provedores. 
                Dados de contato ocultos por privacidade.
              </p>
            </div>

            <div className="space-y-4">
              {crossProviderResults.map((client) => (
                <Card key={client.id} className="border-l-4 border-l-amber-500 bg-amber-50/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Dados do Cliente */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                            <p className="text-sm text-gray-600 font-mono">{client.cpf}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= client.risk_level
                                    ? 'text-red-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">Risco {client.risk_level}/5</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Endereço:</span>
                            <span>{client.address}{client.bairro && `, ${client.bairro}`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">Incluído em:</span>
                            <span>{new Date(client.inclusion_date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-gray-500">({client.days_negative} dias negativado)</span>
                          </div>
                          <div className="bg-gray-100 rounded p-2 mt-2">
                            <span className="font-medium text-gray-700">Motivo:</span>
                            <p className="text-gray-800">{client.inclusion_reason}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informações do Provedor e Dívida */}
                      <div className="space-y-4">
                        {/* Valor da Dívida */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-red-700 font-medium mb-1">Valor em Aberto</p>
                          <p className="text-2xl font-bold text-red-700">
                            R$ {client.debt_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* Informações do Provedor */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-700 font-medium mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Provedor Responsável
                          </p>
                          
                          <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
                            {/* Logo do Provedor */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0 border-2 border-white">
                              {client.provider_logo ? (
                                <img 
                                  src={client.provider_logo} 
                                  alt={client.provider_name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-bold text-sm">
                                  {client.provider_name?.charAt(0).toUpperCase() || 'P'}
                                </span>
                              )}
                            </div>
                            
                            {/* Informações */}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-800">{client.provider_name}</p>
                              <p className="text-xs text-blue-600 font-mono">{client.provider_cnpj}</p>
                            </div>
                          </div>
                        </div>

                        {/* Observações do Provedor */}
                        {client.provider_notes && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800 font-medium mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              Observações
                            </p>
                            <div className="bg-white rounded p-2 border border-amber-200">
                              <p className="text-sm text-gray-800 whitespace-pre-line">{client.provider_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cabeçalho da Seção de Clientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">📋 Seus Clientes Negativados</h3>
              <p className="text-gray-600 text-sm">Gerencie clientes cadastrados e baixe seu contrato de adesão</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowMyClientsSearch(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Meus Clientes
              </Button>
              
              <Button 
                onClick={handleDownloadContract}
                disabled={downloadingContract}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {downloadingContract ? "Baixando..." : "Baixar Contrato"}
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Clientes - Layout Compacto sem Scroll */}
        <div className="space-y-4">
          {clients.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gray-100 rounded-full p-6">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">Seus Clientes Negativados</p>
                      <p className="text-gray-600">Use a área de pesquisa acima para consultar clientes de outros provedores</p>
                      <p className="text-sm text-gray-500 mt-2">Esta seção mostra apenas seus próprios clientes cadastrados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            clients.map((client, index) => (
              <Card key={client.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-xl overflow-hidden" data-testid={`client-card-${client.id}`}>
                {/* Header com gradiente */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{client.name}</h3>
                      <div className="flex items-center gap-3 text-red-100">
                        <span className="font-mono text-sm bg-red-500/30 px-2 py-1 rounded-md backdrop-blur">
                          {client.cpf}
                        </span>
                        <Badge className="bg-white/20 text-white border-white/30">
                          ID: {client.id.slice(-6).toUpperCase()}
                        </Badge>
                        {/* Indicador de Lembrete */}
                        {clientReminders[client.id] && clientReminders[client.id].length > 0 && (
                          <Badge className="bg-purple-500/80 text-white border-purple-400/50">
                            📅 {clientReminders[client.id].filter(r => !r.sent).length} Agendado(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Indicador de Risco */}
                    <div className="text-right">
                      <div className="text-xs text-red-100 mb-1">Nível de Risco</div>
                      <div className="flex items-center justify-end gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (client.risk_level || 1)
                                ? 'text-yellow-300 fill-current drop-shadow-sm'
                                : 'text-red-300/50'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-red-100 mt-1">
                        {client.risk_level === 1 && "Muito Baixo"}
                        {client.risk_level === 2 && "Baixo"}
                        {client.risk_level === 3 && "Médio"}
                        {client.risk_level === 4 && "Alto"}
                        {client.risk_level === 5 && "Muito Alto"}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Corpo do Card */}
                  <div className="space-y-6">
                    
                    {/* Grid Principal de 2 Colunas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Coluna Esquerda */}
                      <div className="space-y-4">
                        {/* Seção de Contato */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            Informações de Contato
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-gray-600">Telefone:</span>
                              <span className="font-medium text-green-600">{client.phone}</span>
                              <Button
                                onClick={() => handleEditPhone(client)}
                                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-7"
                                size="sm"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Editar Telefone
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-blue-600 break-all">{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-gray-600">Endereço:</span>
                              <span className="font-medium text-gray-700">
                                {client.address}{client.bairro && `, ${client.bairro}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Informações da Dívida */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Detalhes da Dívida
                            </h4>
                            <Button
                              onClick={() => handleEditDebt(client)}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 h-7"
                              size="sm"
                            >
                              Editar Valor
                            </Button>
                          </div>
                          <div className="text-center mb-3">
                            <div className="text-3xl font-bold text-red-700 mb-1">
                              R$ {client.debt_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-red-600">Valor em aberto</div>
                          </div>
                          <div className="bg-red-200/50 rounded-md p-3">
                            <div className="text-xs text-red-700 font-medium mb-1">Motivo:</div>
                            <div className="text-sm text-red-800">{client.inclusion_reason}</div>
                          </div>
                        </div>
                      </div>

                      {/* Coluna Direita */}
                      <div className="space-y-4">
                        {/* Informações Adicionais (Observações) */}
                        <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Informações adicionais</h4>
                            <Button
                              onClick={() => {
                                setEditingDebtClient(client);
                                setDebtNotes(client.provider_notes || "");
                                setShowEditNotes(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-7"
                              size="sm"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          </div>
                          {client.provider_notes ? (
                            <div className="bg-white rounded-md p-3 border border-gray-200">
                              <p className="text-sm text-gray-800 whitespace-pre-line">{client.provider_notes}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Nenhuma observação adicionada. Clique em "Editar" para adicionar.</p>
                          )}
                        </div>

                        {/* Histórico e Status */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Histórico e Status
                          </h4>
                          <div className="text-center mb-3">
                            <div className="text-2xl font-semibold text-blue-700 mb-1">
                              {new Date(client.inclusion_date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-blue-600">Data de Inclusão</div>
                          </div>
                          <div className="bg-blue-200/50 rounded-md p-3 text-center">
                            <div className="text-xs text-blue-700 mb-1">Tempo em negativação:</div>
                            <div className="text-lg font-medium text-blue-800">
                              {Math.floor((new Date() - new Date(client.inclusion_date)) / (1000 * 60 * 60 * 24))} dias
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção de Ações - 3 Botões Grandes lado a lado */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Ações Disponíveis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Botão WhatsApp Cobrança - Verde */}
                        <Button
                          onClick={() => handleWhatsAppCharge(client.id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-20"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            <span className="text-sm font-semibold">Enviar Cobrança</span>
                          </div>
                        </Button>

                        {/* Botão Agendar Pagamento - Roxo */}
                        <Button
                          onClick={() => handleSchedulePayment(client)}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-20"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            <span className="text-sm font-semibold">Agendar Pagamento</span>
                          </div>
                        </Button>
                        
                        {/* Botão Excluir Cliente - Vermelho */}
                        <Button
                          onClick={() => handleDeleteClient(client.id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-20"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            <span className="text-sm font-semibold">Excluir Cliente</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Footer da área do provedor */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sistema ControleIsp - Gestão Profissional de Clientes Negativados</p>
        </div>
      </main>

      {/* Payment Modal - DESABILITADO (pagamento via Efi Bank) */}
      {/* <PaymentModal /> */}

      {/* Modal de Meus Clientes */}
      <Dialog open={showMyClientsSearch} onOpenChange={setShowMyClientsSearch}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-blue-600">
              🔍 Pesquisar Meus Clientes
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Formulário de Pesquisa por Nome */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Pesquisar por Nome
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="my-clients-name" className="text-blue-700 font-medium">Nome do Cliente</Label>
                  <Input
                    id="my-clients-name"
                    type="text"
                    className="mt-1 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Digite o nome completo ou parte do nome..."
                    value={myClientsSearchName}
                    onChange={(e) => setMyClientsSearchName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchMyClients()}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    🔍 A busca encontrará clientes que contenham o texto digitado
                  </p>
                </div>
                
                <div className="flex gap-2 items-end">
                  <Button
                    onClick={searchMyClients}
                    disabled={loadingMyClients || !myClientsSearchName.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {loadingMyClients ? "Pesquisando..." : "Pesquisar"}
                  </Button>
                  
                  <Button
                    onClick={clearMyClientsSearch}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    size="lg"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Resultados da Pesquisa */}
            {myClientsResults.length > 0 && (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-blue-50">
                  <h3 className="font-semibold text-blue-900">
                    📋 Resultados ({myClientsResults.length} cliente{myClientsResults.length !== 1 ? 's' : ''} encontrado{myClientsResults.length !== 1 ? 's' : ''})
                  </h3>
                </div>
                
                <div className="max-h-96 overflow-auto">
                  {myClientsResults.map((client, index) => (
                    <div key={client.id || index} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{client.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">CPF: {client.cpf}</p>
                          {client.phone && (
                            <p className="text-sm text-gray-600">📱 {client.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Endereço</span>
                          </div>
                          <p className="text-sm text-gray-600">{client.address}</p>
                          {client.bairro && (
                            <p className="text-sm text-gray-600">Bairro: {client.bairro}</p>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Situação</span>
                          </div>
                          <p className="text-sm font-semibold text-red-600">
                            Dívida: R$ {client.debt_amount?.toFixed(2) || '0,00'}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            client.risk === 'alto' ? 'bg-red-100 text-red-800' :
                            client.risk === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            Risco {client.risk || 'baixo'}
                          </span>
                        </div>
                      </div>
                      
                      {client.inclusion_reason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <strong>Motivo:</strong> {client.inclusion_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Estado vazio */}
            {myClientsResults.length === 0 && myClientsSearchName === "" && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pesquise seus clientes por nome</h3>
                <p className="text-gray-600">Digite o nome do cliente no campo acima para encontrá-lo na sua lista</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropdown de Notificações - Renderizado como portal */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-50" 
          onClick={() => setShowNotifications(false)}
        >
          <div 
            className="absolute top-16 right-4 w-80 bg-white border rounded-lg shadow-lg max-h-96 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">📢 Notificações</h3>
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllNotificationsAsRead}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </div>
            
            {loadingNotifications ? (
              <div className="p-4 text-center text-gray-500">
                Carregando notificações...
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification, index) => (
                  <div 
                    key={notification.id || `notification-${index}`}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {notification.type === 'info' && 'ℹ️'}
                            {notification.type === 'warning' && '⚠️'}
                            {notification.type === 'maintenance' && '🔧'}
                            {notification.type === 'promotion' && '🎉'}
                          </span>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {notification.priority === 'urgent' && (
                            <span className="text-xs bg-red-100 text-red-800 px-1 rounded">URGENTE</span>
                          )}
                          {notification.priority === 'high' && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">ALTA</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs mb-1">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {notification.created_at && new Date(notification.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {!notification.is_read && (
                          <span className="text-xs text-blue-600 font-medium ml-2">• Nova</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Nenhuma notificação disponível</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      <Dialog open={showEditPhone} onOpenChange={setShowEditPhone}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Editar Telefone do Cliente
            </DialogTitle>
            {editingClient && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-medium">{editingClient.name}</p>
                <p className="text-xs">CPF: {editingClient.cpf}</p>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-phone">Novo Telefone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="mt-1"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: (11) 99999-9999 ou 11999999999
              </p>
            </div>

            {editingClient && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Telefone atual:</strong> {editingClient.phone}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCancelEditPhone}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePhone}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!newPhone.trim() || newPhone === editingClient?.phone}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Edit Debt Modal */}
      <Dialog open={showEditDebt} onOpenChange={setShowEditDebt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
              Editar Valor da Dívida
            </DialogTitle>
            {editingDebtClient && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-medium">{editingDebtClient.name}</p>
                <p className="text-xs">CPF: {editingDebtClient.cpf}</p>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-debt">Novo Valor da Dívida (R$)</Label>
              <Input
                id="edit-debt"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newDebt}
                onChange={(e) => setNewDebt(e.target.value)}
                className="mt-1"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite o valor correto da dívida em Reais
              </p>
            </div>

            {editingDebtClient && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Valor atual:</strong> R$ {editingDebtClient.debt_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Esta alteração é manual e não afeta os valores no IXC. Use para corrigir divergências quando necessário.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCancelEditDebt}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveDebt}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={!newDebt.trim() || parseFloat(newDebt) === editingDebtClient?.debt_amount}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Notes Modal */}
      <Dialog open={showEditNotes} onOpenChange={setShowEditNotes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Editar Observações / Anotações
            </DialogTitle>
            {editingDebtClient && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-medium">{editingDebtClient.name}</p>
                <p className="text-xs">CPF: {editingDebtClient.cpf}</p>
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes-textarea" className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Observações / Anotações (Opcional)
              </Label>
              <textarea
                id="notes-textarea"
                value={debtNotes}
                onChange={(e) => setDebtNotes(e.target.value)}
                placeholder="Ex: Cliente não retornou contato&#10;Cliente levou os equipamentos&#10;Cliente não mora mais no endereço&#10;Acordo de parcelamento em andamento"
                className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                maxLength="500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  💡 Estas informações serão visíveis para outros provedores que consultarem este CPF
                </p>
                <span className="text-xs text-gray-400">
                  {debtNotes.length}/500
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ℹ️ <strong>Dica:</strong> Use este campo para adicionar informações importantes sobre o cliente, histórico de negociações, acordos ou observações relevantes.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                setShowEditNotes(false);
                setEditingDebtClient(null);
                setDebtNotes("");
              }}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNotes}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil do Provedor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white">
                  {providerInfo.logo_url || providerLogo ? (
                    <img 
                      src={providerLogo || providerInfo.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-4xl">
                      {providerInfo.nome_fantasia?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  )}
                </div>
                
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="logo-upload" 
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input 
                    id="logo-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 mb-1">Foto do Perfil</p>
                <p className="text-xs text-gray-600">
                  Clique no ícone para alterar
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos: JPG, PNG • Máximo: 10MB
                </p>
              </div>
            </div>

            {/* Provider Info */}
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">Nome Fantasia</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{providerInfo.nome_fantasia || 'Não informado'}</p>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase">CNPJ</label>
                <p className="text-lg font-mono text-gray-900 mt-1">{providerInfo.cnpj || 'Não informado'}</p>
              </div>

              {/* Contact Info Section - Email and Phone together */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Informações de Contato</h3>
                  {!editingProfile && (
                    <Button
                      onClick={() => setEditingProfile(true)}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    {editingProfile ? (
                      <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 bg-white"
                        placeholder="seuemail@provedor.com"
                      />
                    ) : (
                      <p className="text-base text-gray-900 mt-1">{providerInfo.email || 'Não informado'}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefone
                    </label>
                    {editingProfile ? (
                      <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 bg-white"
                        placeholder="(00) 00000-0000"
                      />
                    ) : (
                      <p className="text-base text-gray-900 mt-1">{providerInfo.phone || 'Não informado'}</p>
                    )}
                  </div>
                </div>

                {/* Save/Cancel buttons when editing */}
                {editingProfile && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileData({
                          email: providerInfo.email || '',
                          phone: providerInfo.phone || ''
                        });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                )}
              </div>

              {/* Password Section */}
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Senha</label>
                  {!showPasswordFields && (
                    <Button
                      onClick={() => setShowPasswordFields(true)}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Alterar
                    </Button>
                  )}
                </div>
                
                {showPasswordFields ? (
                  <div className="space-y-3 mt-3">
                    <div>
                      <Label className="text-xs">Senha Antiga</Label>
                      <Input
                        type="password"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                        placeholder="Digite sua senha atual"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nova Senha</Label>
                      <Input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Confirmar Nova Senha</Label>
                      <Input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Digite novamente"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setShowPasswordFields(false);
                          setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUpdatePassword}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg text-gray-900">••••••••</p>
                )}
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Sua logo será exibida quando outros provedores pesquisarem por clientes cadastrados por você.
                </span>
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowProfileModal(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showImageCrop} onOpenChange={setShowImageCrop}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ajustar Logo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Zoom</Label>
                <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800 space-y-1">
                  <p className="font-semibold">Como ajustar sua logo:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Arraste a imagem para reposicionar</li>
                    <li>Use o controle deslizante para dar zoom</li>
                    <li>A área circular será sua logo final</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setShowImageCrop(false);
                setImageSrc(null);
                // Reopen profile modal after short delay
                setTimeout(() => {
                  setShowProfileModal(true);
                }, 300);
              }}
              variant="outline"
              className="flex-1"
              disabled={uploadingLogo}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogoUpload}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvar Logo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Payment Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Agendar Lembrete de Pagamento
            </DialogTitle>
            {reminderClient && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-medium">{reminderClient.name}</p>
                <p className="text-xs">CPF: {reminderClient.cpf}</p>
                <p className="text-xs">Dívida atual: R$ {parseFloat(reminderClient.debt_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleCreateReminder} className="space-y-4">
            <div>
              <Label htmlFor="reminder-date">Data do Lembrete *</Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderData.reminder_date}
                onChange={(e) => setReminderData({...reminderData, reminder_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Data em que o cliente prometeu pagar
              </p>
            </div>

            <div>
              <Label htmlFor="reminder-amount">Valor do Pagamento *</Label>
              <Input
                id="reminder-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={reminderData.amount}
                onChange={(e) => setReminderData({...reminderData, amount: e.target.value})}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor que o cliente se comprometeu a pagar
              </p>
            </div>

            <div>
              <Label htmlFor="reminder-notes">Observações</Label>
              <Textarea
                id="reminder-notes"
                placeholder="Ex: Cliente disse que recebeu pagamento no dia X..."
                value={reminderData.notes}
                onChange={(e) => setReminderData({...reminderData, notes: e.target.value})}
                className="mt-1 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Informações adicionais sobre o compromisso
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-800">Lembrete Automático</p>
                  <p className="text-purple-700">
                    Uma mensagem será enviada automaticamente no dia agendado com:
                  </p>
                  <ul className="list-disc list-inside text-purple-600 text-xs mt-1 space-y-1">
                    <li>Dados do pagamento e valor</li>
                    <li>Chave PIX para pagamento direto</li>
                    <li>Instruções para envio de comprovante</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={() => setShowReminderModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Agendar Lembrete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento de Agendamentos */}
      <Dialog open={showScheduleManager} onOpenChange={setShowScheduleManager}>
        <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Gerenciamento de Agendamentos
            </DialogTitle>
            <p className="text-gray-600">Controle completo de todos os agendamentos de pagamento</p>
          </DialogHeader>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-yellow-700">{scheduledReminders.filter(r => r.status === 'scheduled').length}</div>
              <div className="text-xs text-yellow-600">Agendados</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-700">{scheduledReminders.filter(r => r.status === 'sent').length}</div>
              <div className="text-xs text-blue-600">Enviados</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-700">{scheduledReminders.filter(r => r.status === 'paid').length}</div>
              <div className="text-xs text-green-600">Pagos</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-700">
                R$ {scheduledReminders.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-purple-600">Total</div>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="overflow-y-auto max-h-[400px] border border-gray-200 rounded-lg">
            {loadingReminders ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando agendamentos...</p>
              </div>
            ) : scheduledReminders.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Nenhum agendamento encontrado</p>
                <p className="text-gray-500 text-sm">Crie agendamentos através dos cards de clientes</p>
              </div>
            ) : (
              <div className="divide-y">
                {scheduledReminders.map((reminder) => (
                  <div key={reminder.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-medium text-gray-900">{reminder.client_name}</div>
                          <Badge className={`text-xs ${getStatusColor(reminder.status)}`}>
                            {getStatusIcon(reminder.status)}
                            <span className="ml-1">{getStatusText(reminder.status)}</span>
                          </Badge>
                          {reminder.status === 'scheduled' && new Date(reminder.reminder_date) <= new Date() && (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Vencido
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">📅 Data:</span> {new Date(reminder.reminder_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <span className="font-medium">💰 Valor:</span> R$ {reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div>
                            <span className="font-medium">📞 Telefone:</span> {reminder.client_phone}
                          </div>
                        </div>
                        
                        {reminder.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                            <span className="font-medium">📝 Observações:</span> {reminder.notes}
                          </div>
                        )}
                        
                        {reminder.sent_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Enviado em:</span> {new Date(reminder.sent_at).toLocaleString('pt-BR')}
                          </div>
                        )}
                        
                        {reminder.paid_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Pago em:</span> {new Date(reminder.paid_at).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {reminder.status === 'scheduled' && (
                          <Button
                            onClick={() => sendScheduledReminder(reminder)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={sendingReminder}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Enviar
                          </Button>
                        )}
                        
                        {reminder.status === 'sent' && (
                          <Button
                            onClick={() => markReminderAsPaid(reminder)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Marcar Pago
                          </Button>
                        )}
                        
                        {reminder.status !== 'paid' && (
                          <Button
                            onClick={() => deleteScheduledReminder(reminder)}
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações em Lote */}
          {scheduledReminders.filter(r => r.status === 'scheduled').length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-800 mb-1">Ações Automáticas</h4>
                  <p className="text-sm text-purple-600">
                    {scheduledReminders.filter(r => r.status === 'scheduled' && r.reminder_date === new Date().toISOString().split('T')[0]).length} agendamento(s) para hoje
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendTodayReminders}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar Cobranças de Hoje
                  </Button>
                  <Button
                    onClick={() => loadScheduledReminders()}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Atualizar Lista
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowScheduleManager(false)}
              variant="outline"
              className="px-6"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Notificação Simples */}
      <Dialog open={showNotificationAlert} onOpenChange={setShowNotificationAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-red-600">
              📢 Nova Notificação
            </DialogTitle>
          </DialogHeader>
          
          {currentNotification && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentNotification.title}
                </h3>
                <p className="text-gray-700">
                  {currentNotification.message}
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={markCurrentNotificationAsRead}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  data-testid="confirm-notification-button"
                >
                  Li e Entendi
                </Button>
                <Button
                  onClick={() => setShowNotificationAlert(false)}
                  variant="outline"
                  className="px-6"
                  data-testid="close-notification-button"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Meu Financeiro */}
      <Dialog open={showFinancialModal} onOpenChange={setShowFinancialModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-purple-600" />
              Meu Financeiro
              {isBlocked && (
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  ⚠️ Conta Bloqueada - Pagamento em Atraso
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingPayments ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando pagamentos...</p>
            </div>
          ) : myPayments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Seleção Múltipla e Ações em Lote */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPayments.length === myPayments.length && myPayments.length > 0}
                      onChange={handleSelectAllPayments}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedPayments.length > 0 ? `${selectedPayments.length} selecionada(s)` : 'Selecionar todas'}
                    </span>
                  </div>
                  
                  {selectedPayments.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkMarkAsPaid}
                        disabled={processingBulkAction}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                      >
                        ✓ Marcar como Recebidas
                      </button>
                      <button
                        onClick={handleBulkCancel}
                        disabled={processingBulkAction}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                      >
                        ✗ Cancelar Selecionadas
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtros */}
              <div className="flex gap-2 flex-wrap">
                <button className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium">
                  Todos ({myPayments.length})
                </button>
                <button className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                  Em Aberto ({myPayments.filter(p => p.status === 'pending' && new Date(p.expires_at) >= new Date()).length})
                </button>
                <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium">
                  Atrasados ({myPayments.filter(p => p.status === 'pending' && new Date(p.expires_at) < new Date()).length})
                </button>
                <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium">
                  Pagos ({myPayments.filter(p => p.status === 'paid').length})
                </button>
              </div>

              {/* Lista de Pagamentos */}
              {myPayments.map((payment) => {
                const isOverdue = payment.status === 'pending' && new Date(payment.expires_at) < new Date();
                const isPending = payment.status === 'pending' && new Date(payment.expires_at) >= new Date();
                
                return (
                  <div 
                    key={payment.id} 
                    className={`border rounded-lg p-4 ${
                      isOverdue ? 'border-l-4 border-l-red-500 bg-red-50' :
                      isPending ? 'border-l-4 border-l-yellow-500 bg-yellow-50' :
                      'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          payment.status === 'paid' ? 'bg-green-500' :
                          isOverdue ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {payment.payment_method === 'boleto' ? '📄 Boleto Bancário' : '💳 PIX'}
                            {isOverdue && <span className="ml-2 text-xs text-red-600 font-bold">⚠️ ATRASADO</span>}
                          </h4>
                          <p className="text-sm text-gray-500">ID: {payment.payment_id || payment.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          R$ {payment.amount ? payment.amount.toFixed(2) : '0.00'}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                          isOverdue ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status === 'paid' ? 'Pago' : isOverdue ? 'Atrasado' : 'Em Aberto'}
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
                          <p className="text-gray-500">Vencimento:</p>
                          <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                            {new Date(payment.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {payment.paid_at && (
                        <div>
                          <p className="text-gray-500">Pago em:</p>
                          <p className="font-medium text-green-600">{new Date(payment.paid_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {payment.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {payment.link && (
                          <a
                            href={payment.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                          >
                            🖨️ Abrir Boleto
                          </a>
                        )}
                        {payment.pdf && (
                          <a
                            href={payment.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium"
                          >
                            📄 Baixar PDF
                          </a>
                        )}
                        {payment.barcode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(payment.barcode);
                              alert('Código de barras copiado!');
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 font-medium"
                          >
                            📋 Copiar Código de Barras
                          </button>
                        )}
                        {payment.qr_code && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(payment.qr_code);
                              alert('Código PIX copiado!');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium"
                          >
                            💳 Copiar Código PIX
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowFinancialModal(false)} variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tela de Bloqueio - Aceite de Termos (Primeiro Login) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                }}></div>
              </div>
              <div className="relative z-10">
                <div className="inline-block bg-white bg-opacity-20 rounded-full p-4 mb-4">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">🎉 Bem-vindo ao ControleIsp!</h1>
                <p className="text-purple-100 text-lg">Seu cadastro foi realizado com sucesso</p>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-8 space-y-6">
              {/* Mensagem de Boas-Vindas */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-3xl">🎁</span>
                  Oferta Especial de Boas-Vindas!
                </h2>
                <p className="text-gray-700 text-lg mb-4">
                  Para começar a usar o sistema, precisamos que você aceite nossos termos de uso. 
                  Ao aceitar, você terá <strong className="text-green-700">acesso imediato</strong> ao sistema e seu plano de assinatura será ativado automaticamente!
                </p>
              </div>

              {/* Detalhes do Plano */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Seu Plano de Assinatura
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-600 rounded-full p-2 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">12 Parcelas Automáticas</p>
                        <p className="text-sm text-gray-600">Geradas assim que você aceitar os termos</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 rounded-full p-2 mt-1">
                        <span className="text-white font-bold">🎁</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">3 Meses Promocionais</p>
                        <p className="text-sm text-gray-600">Apenas <strong className="text-green-700">R$ 99,90/mês</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 rounded-full p-2 mt-1">
                        <span className="text-white font-bold">💰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Valor Integral</p>
                        <p className="text-sm text-gray-600">Após período promocional: R$ 199,90/mês</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-indigo-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-600 rounded-full p-2 mt-1">
                        <span className="text-white font-bold">📅</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Vencimento Escolhido</p>
                        <p className="text-sm text-gray-600">Todo dia <strong className="text-indigo-700">{providerInfo?.due_day || '10'}</strong> do mês</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span><strong>Primeira parcela proporcional:</strong> Você pagará apenas pelos dias até o primeiro vencimento!</span>
                  </p>
                </div>
              </div>

              {/* Termos de Uso */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📜</span>
                  Termos de Uso do Sistema
                </h3>
                <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200">
                  <div className="text-sm text-gray-700 space-y-3">
                    <p className="font-semibold text-gray-900">Ao aceitar estes termos, você concorda com:</p>
                    <ul className="space-y-2 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Utilizar o sistema apenas para fins legítimos de gestão de clientes negativados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Manter seus dados de acesso seguros e não compartilhar com terceiros</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Pagar as mensalidades nos vencimentos estabelecidos para manter acesso ao sistema</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Respeitar a Lei Geral de Proteção de Dados (LGPD) no tratamento de informações dos clientes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Não utilizar o sistema para práticas abusivas, ilegais ou de cobrança vexatória</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>Aceitar que o não pagamento resultará em bloqueio temporário após 3 dias do vencimento</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold mt-1">•</span>
                        <span>As informações cadastradas são de sua responsabilidade e devem ser verdadeiras</span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-medium text-gray-900">
                        📋 <strong>Importante:</strong> Suas 12 parcelas serão geradas automaticamente e estarão disponíveis 
                        na seção "Meu Financeiro" para consulta e pagamento a qualquer momento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Aceite */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button 
                  onClick={handleAcceptTerms} 
                  disabled={acceptingTerms}
                  className="w-full max-w-md h-16 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  {acceptingTerms ? (
                    <>
                      <span className="animate-spin mr-3 text-2xl">⏳</span>
                      Gerando suas parcelas de boas-vindas...
                    </>
                  ) : (
                    <>
                      <span className="mr-3 text-2xl">✅</span>
                      Aceito os Termos - Liberar Meu Acesso Agora!
                    </>
                  )}
                </Button>
                
                {!acceptingTerms && (
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Ao clicar no botão acima, você confirma que leu e concorda com todos os termos de uso do sistema.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rodapé */}
      <footer className="text-gray-700 py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-1">
            <p className="text-xs font-medium">Desenvolvido para Provedores de Internet em Todo o Brasil | Todos os Direitos Reservados</p>
            <p className="text-xs text-gray-600">© 2025 ControleIsp</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Main App Component
function App() {
  // Redirect de www para não-www (PAUSADO PARA TESTES)
  /*
  useEffect(() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    
    // Se acessar www.controleisp.com.br, redireciona para controleisp.com.br (sem www)
    if (hostname === 'www.controleisp.com.br') {
      const newUrl = `${protocol}//controleisp.com.br${pathname}${search}${hash}`;
      window.location.replace(newUrl);
    }
  }, []);
  */

  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#f8f9fa',
            color: '#212529',
            border: '1px solid #dee2e6'
          }
        }} 
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthenticatedApp />} />
        <Route path="/admin" element={<AdminAuthenticatedApp />} />
      </Routes>
    </Router>
  );
}

// Componente para gerenciar autenticação de administradores
function AdminAuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            const userType = decoded.user_type;
            // Só permitir admin nesta rota
            if (userType === "admin") {
              setUser(userType);
            } else {
              // Se não for admin, limpar token e redirecionar
              localStorage.removeItem("token");
              setUser(null);
            }
          } else {
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userType, userName) => {
    // Só aceitar admin
    if (userType === "admin") {
      setUser(userType);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("userName");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center">
        <div className="text-lg text-white">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </>
  );
}

// Componente para gerenciar autenticação de provedores
function AuthenticatedApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            const userType = decoded.user_type;
            // Só permitir provedor nesta rota
            if (userType === "provider") {
              setUser(userType);
            } else {
              // Se for admin, limpar token e redirecionar
              localStorage.removeItem("token");
              setUser(null);
            }
          } else {
            localStorage.removeItem("token");
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userType) => {
    // Só aceitar provedor
    if (userType === "provider") {
      setUser(userType);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ProviderDashboard onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;