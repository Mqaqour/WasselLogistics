import React, { useState } from 'react';
import { Package, CreditCard, AlertCircle, Check, ArrowRight, FileText, CheckSquare, Square } from 'lucide-react';
import { Shipment, Language } from '../types';

interface DashboardProps {
    lang: Language;
}

interface Invoice {
    id: string;
    amount: number;
    status: 'Paid' | 'Unpaid';
    date: string;
    description: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'invoices'>('shipments');
  const [payModalOpen, setPayModalOpen] = useState(false);
  // Store selected invoices for multi-payment
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  // Mock Invoices Data
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'INV-2023-001', amount: 150.00, status: 'Unpaid', date: 'Oct 20, 2023', description: 'Logistics Service - Standard' },
    { id: 'INV-2023-002', amount: 450.50, status: 'Paid', date: 'Oct 15, 2023', description: 'International Shipping' },
    { id: 'INV-2023-003', amount: 75.00, status: 'Unpaid', date: 'Oct 22, 2023', description: 'Customs Clearance Fee' },
    { id: 'INV-2023-004', amount: 200.00, status: 'Unpaid', date: 'Oct 24, 2023', description: 'Freight Charge' },
  ]);

  const t = {
      welcome: lang === 'en' ? 'Welcome back, Ahmed' : 'مرحباً أحمد',
      subtitle: lang === 'en' ? 'Manage your shipments and payments.' : 'إدارة شحناتك ومدفوعاتك.',
      myShipments: lang === 'en' ? 'My Shipments' : 'شحناتي',
      myInvoices: lang === 'en' ? 'My Invoices' : 'فواتيري',
      activeShipments: lang === 'en' ? 'Active Shipments' : 'شحنات نشطة',
      deliveredMonth: lang === 'en' ? 'Delivered (This Month)' : 'تم التوصيل (هذا الشهر)',
      unpaidInvoices: lang === 'en' ? 'Unpaid Invoices' : 'فواتير غير مدفوعة',
      invoiceId: lang === 'en' ? 'Invoice ID' : 'رقم الفاتورة',
      date: lang === 'en' ? 'Date' : 'التاريخ',
      desc: lang === 'en' ? 'Description' : 'الوصف',
      amount: lang === 'en' ? 'Amount' : 'المبلغ',
      status: lang === 'en' ? 'Status' : 'الحالة',
      pay: lang === 'en' ? 'Pay' : 'دفع',
      paySelected: lang === 'en' ? 'Pay Selected' : 'دفع المحدد',
      payInvoice: lang === 'en' ? 'Pay Invoice' : 'دفع الفاتورة',
      payTotal: lang === 'en' ? 'Pay Total Amount' : 'دفع المبلغ الإجمالي',
      cardNumber: lang === 'en' ? 'Card Number' : 'رقم البطاقة',
      expiry: lang === 'en' ? 'Expiry' : 'تاريخ الانتهاء',
      cvc: lang === 'en' ? 'CVC' : 'رمز الأمان',
      confirmPayment: lang === 'en' ? 'Confirm Payment' : 'تأكيد الدفع',
      cancel: lang === 'en' ? 'Cancel' : 'إلغاء',
      paid: lang === 'en' ? 'Paid' : 'مدفوعة',
      unpaid: lang === 'en' ? 'Unpaid' : 'غير مدفوعة',
      delivered: lang === 'en' ? 'Delivered' : 'تم التوصيل',
      inTransit: lang === 'en' ? 'In Transit' : 'في الطريق',
      pending: lang === 'en' ? 'Pending' : 'قيد الانتظار',
      exception: lang === 'en' ? 'Exception' : 'استثناء',
      totalSelected: lang === 'en' ? 'Total Selected:' : 'المجموع المحدد:',
      selectAll: lang === 'en' ? 'Select All' : 'تحديد الكل'
  };

  // Mock Shipments Data
  const recentShipments: Shipment[] = [
    { id: 'WSL-99887766', origin: lang === 'en' ? 'Jeddah' : 'جدة', destination: lang === 'en' ? 'Riyadh' : 'الرياض', status: 'In Transit', eta: 'Oct 25' },
    { id: 'WSL-55443322', origin: lang === 'en' ? 'Dammam' : 'الدمام', destination: lang === 'en' ? 'Dubai' : 'دبي', status: 'Pending', eta: 'Oct 28' },
    { id: 'WSL-11223344', origin: lang === 'en' ? 'London' : 'لندن', destination: lang === 'en' ? 'Riyadh' : 'الرياض', status: 'Delivered', eta: 'Oct 20' },
  ];

  const handlePaySingle = (invoiceId: string) => {
    setSelectedInvoices([invoiceId]);
    setPayModalOpen(true);
  };

  const handlePaySelected = () => {
      if(selectedInvoices.length > 0) {
          setPayModalOpen(true);
      }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
      setSelectedInvoices(prev => 
          prev.includes(invoiceId) 
          ? prev.filter(id => id !== invoiceId) 
          : [...prev, invoiceId]
      );
  };

  const toggleSelectAll = () => {
      const unpaidInvoices = invoices.filter(inv => inv.status === 'Unpaid');
      if (selectedInvoices.length === unpaidInvoices.length && unpaidInvoices.length > 0) {
          setSelectedInvoices([]);
      } else {
          setSelectedInvoices(unpaidInvoices.map(inv => inv.id));
      }
  };

  const processPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark selected invoices as paid
    setInvoices(prev => prev.map(inv => 
        selectedInvoices.includes(inv.id) ? { ...inv, status: 'Paid' } : inv
    ));
    alert(`${selectedInvoices.length} Invoice(s) processed successfully!`);
    setSelectedInvoices([]);
    setPayModalOpen(false);
  };

  const getStatusText = (status: string) => {
      switch(status) {
          case 'Delivered': return t.delivered;
          case 'In Transit': return t.inTransit;
          case 'Pending': return t.pending;
          case 'Paid': return t.paid;
          case 'Unpaid': return t.unpaid;
          default: return status;
      }
  };

  const unpaidInvoicesList = invoices.filter(i => i.status === 'Unpaid');
  const allUnpaidSelected = unpaidInvoicesList.length > 0 && selectedInvoices.length === unpaidInvoicesList.length;
  
  const totalAmountToPay = invoices
    .filter(inv => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="w-full max-w-[1920px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-wassel-blue">{t.welcome}</h1>
          <p className="text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2 rtl:space-x-reverse">
            <button 
                onClick={() => setActiveTab('shipments')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'shipments' ? 'bg-wassel-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                {t.myShipments}
            </button>
            <button 
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'invoices' ? 'bg-wassel-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                {t.myInvoices}
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-100">
            <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <Package className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.activeShipments}</p>
                    <p className="text-2xl font-bold text-gray-900">{recentShipments.filter(s => s.status === 'In Transit' || s.status === 'Pending').length}</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-200">
            <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <Check className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.deliveredMonth}</p>
                    <p className="text-2xl font-bold text-gray-900">14</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pop delay-300">
            <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div className="rtl:mr-4 ltr:ml-4">
                    <p className="text-sm font-medium text-gray-500">{t.unpaidInvoices}</p>
                    <p className="text-2xl font-bold text-gray-900">{unpaidInvoicesList.length}</p>
                </div>
            </div>
        </div>
      </div>

      {activeTab === 'shipments' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md animate-slide-up delay-300">
            <ul className="divide-y divide-gray-200">
                {recentShipments.map((shipment) => (
                <li key={shipment.id} className="hover:bg-gray-50 transition-colors">
                    <div className="px-4 py-4 flex items-center sm:px-6 cursor-pointer">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                        <div className="flex text-sm font-medium text-wassel-yellow truncate">
                            {shipment.id}
                        </div>
                        <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500">
                            <p className="truncate">{shipment.origin} &rarr; {shipment.destination}</p>
                            </div>
                        </div>
                        </div>
                        <div className="mt-4 flex-shrink-0 sm:mt-0 rtl:sm:mr-5 ltr:sm:ml-5">
                        <div className="flex overflow-hidden -space-x-1 rtl:space-x-reverse">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {getStatusText(shipment.status)}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 rtl:text-left ltr:text-right">ETA: {shipment.eta}</p>
                        </div>
                    </div>
                    <div className="rtl:mr-5 ltr:ml-5 flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-gray-400 rtl:rotate-180" />
                    </div>
                    </div>
                </li>
                ))}
            </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-slide-up delay-300">
             {/* Invoice Toolbar */}
             {selectedInvoices.length > 0 && (
                 <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center animate-enter">
                     <span className="font-bold text-wassel-blue">{t.totalSelected} {totalAmountToPay.toFixed(2)} ILS</span>
                     <button 
                        onClick={handlePaySelected}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center transition-colors"
                     >
                        <CreditCard className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
                        {t.paySelected} ({selectedInvoices.length})
                     </button>
                 </div>
             )}

             <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left">
                      <button onClick={toggleSelectAll} className="focus:outline-none">
                          {allUnpaidSelected ? (
                              <CheckSquare className="w-5 h-5 text-wassel-blue" />
                          ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                          )}
                      </button>
                  </th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.invoiceId}</th>
                  <th scope="col" className="hidden md:table-cell px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.desc}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.date}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.amount}</th>
                  <th scope="col" className="px-6 py-3 rtl:text-right ltr:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Pay</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => {
                    const isSelected = selectedInvoices.includes(invoice.id);
                    return (
                        <tr key={invoice.id} className={`${isSelected ? 'bg-blue-50' : ''} transition-colors duration-150`}>
                            <td className="px-6 py-4">
                                {invoice.status === 'Unpaid' && (
                                    <button onClick={() => toggleInvoiceSelection(invoice.id)} className="focus:outline-none">
                                        {isSelected ? (
                                            <CheckSquare className="w-5 h-5 text-wassel-blue" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{invoice.amount} ILS</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {getStatusText(invoice.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap rtl:text-left ltr:text-right text-sm font-medium">
                                {invoice.status === 'Unpaid' && (
                                    <button onClick={() => handlePaySingle(invoice.id)} className="text-wassel-yellow hover:text-wassel-lightYellow font-bold flex items-center rtl:justify-start ltr:justify-end w-full transition-colors">
                                        <CreditCard className="w-4 h-4 rtl:ml-1 ltr:mr-1" /> {t.pay}
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
        </div>
      )}

      {/* Payment Modal */}
      {payModalOpen && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
             <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={() => setPayModalOpen(false)}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <div className="inline-block align-bottom bg-white rounded-lg rtl:text-right ltr:text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full animate-pop">
                    <form onSubmit={processPayment} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {selectedInvoices.length > 1 ? t.payTotal : t.payInvoice}
                            </h3>
                            <div className="mt-2 text-2xl font-bold text-wassel-blue">
                                {totalAmountToPay.toFixed(2)} ILS
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {selectedInvoices.length} {lang === 'en' ? 'invoice(s) selected' : 'فاتورة محددة'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t.cardNumber}</label>
                                <input required type="text" placeholder="0000 0000 0000 0000" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.expiry}</label>
                                    <input required type="text" placeholder="MM/YY" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t.cvc}</label>
                                    <input required type="text" placeholder="123" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-wassel-yellow focus:border-wassel-yellow" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-6">
                             <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-wassel-blue text-base font-medium text-white hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow sm:text-sm transition-colors">
                                {t.confirmPayment}
                            </button>
                             <button type="button" onClick={() => setPayModalOpen(false)} className="mt-2 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none sm:text-sm transition-colors">
                                {t.cancel}
                            </button>
                        </div>
                    </form>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};