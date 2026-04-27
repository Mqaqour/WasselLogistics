import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, Search, CheckCircle, AlertCircle, Loader2, ArrowLeft, Upload, FileText, X } from 'lucide-react';
import { Language } from '../../types';

interface PaymentGatewayProps {
  lang: Language;
  initialParams?: { ref: string; service: string; billDetails?: { label: string; amount: number }[] } | null;
  isPopup?: boolean;
}

type ServiceType = 'jordan_green' | 'jordan_blue' | 'cod' | 'invoice' | 'customs' | 'clearance_downpayment';

interface ClearanceRequirement {
    files: string[]; // List of file names required e.g. ['Invoice', 'ID']
    fee: number;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ lang, initialParams, isPopup = false }) => {
  const [step, setStep] = useState<'search' | 'upload' | 'confirm' | 'success'>('search');
  const [selectedService, setSelectedService] = useState<ServiceType>('jordan_green');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [retrievedAmount, setRetrievedAmount] = useState<number | null>(null);
  const [requiredFiles, setRequiredFiles] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billDetails, setBillDetails] = useState<{ label: string; amount: number }[] | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialParams) {
        setReferenceNumber(initialParams.ref);
        // Cast strictly to ServiceType to ensure compatibility
        const validService = initialParams.service as ServiceType;
        setSelectedService(validService);
        
        // If bill details are passed directly (e.g. from downpayment tracking)
        if (initialParams.billDetails) {
            setBillDetails(initialParams.billDetails);
            const total = initialParams.billDetails.reduce((sum, item) => sum + item.amount, 0);
            setRetrievedAmount(total);
            setStep('confirm');
        } else {
            // Auto trigger search logic if just ref and service
            checkStatus(initialParams.ref, validService);
        }
    }
  }, [initialParams]);

  const t = {
    title: lang === 'en' ? 'Wassel Pay' : 'واصل باي',
    subtitle: lang === 'en' ? 'Pay for logistics services, invoices, and government transactions securely.' : 'ادفع مقابل الخدمات اللوجستية والفواتير والمعاملات الحكومية بأمان.',
    selectService: lang === 'en' ? 'Select Service Type' : 'اختر نوع الخدمة',
    refNumber: lang === 'en' ? 'Reference Number / Tracking ID' : 'رقم المرجع / رقم التتبع',
    refPlaceholder: lang === 'en' ? 'Enter number...' : 'أدخل الرقم...',
    retrieve: lang === 'en' ? 'Check Status' : 'فحص الحالة',
    amountDue: lang === 'en' ? 'Amount Due' : 'المبلغ المستحق',
    service: lang === 'en' ? 'Service' : 'الخدمة',
    payNow: lang === 'en' ? 'Pay Now' : 'ادفع الآن',
    back: lang === 'en' ? 'Back' : 'رجوع',
    successTitle: lang === 'en' ? 'Transaction Successful!' : 'تمت العملية بنجاح!',
    successDesc: lang === 'en' ? 'Your transaction has been processed successfully.' : 'تمت معالجة معاملتك بنجاح.',
    transId: lang === 'en' ? 'Transaction ID' : 'رقم المعاملة',
    newPayment: lang === 'en' ? 'Make Another Transaction' : 'إجراء معاملة أخرى',
    searching: lang === 'en' ? 'Retrieving details...' : 'جاري جلب التفاصيل...',
    processing: lang === 'en' ? 'Processing...' : 'جاري المعالجة...',
    errorRef: lang === 'en' ? 'Reference not found. Please check and try again.' : 'الرقم المرجعي غير موجود. يرجى التحقق والمحاولة مرة أخرى.',
    cardInfo: lang === 'en' ? 'Credit Card Information' : 'معلومات البطاقة الائتمانية',
    cardNum: lang === 'en' ? 'Card Number' : 'رقم البطاقة',
    expiry: lang === 'en' ? 'Expiry (MM/YY)' : 'الانتهاء (MM/YY)',
    cvc: lang === 'en' ? 'CVC' : 'رمز الأمان',
    breakdownTitle: lang === 'en' ? 'Service Breakdown' : 'تفاصيل الخدمات',
    
    // Customs Specific
    uploadTitle: lang === 'en' ? 'Documents Required' : 'المستندات المطلوبة',
    uploadDesc: lang === 'en' ? 'Customs clearance for this shipment requires the following documents.' : 'يتطلب التخليص الجمركي لهذه الشحنة المستندات التالية.',
    dragDrop: lang === 'en' ? 'Click to upload or drag and drop' : 'انقر للرفع أو اسحب وأفلت',
    supportedFiles: lang === 'en' ? 'PDF, PNG, JPG up to 10MB' : 'PDF, PNG, JPG بحد أقصى 10 ميجابايت',
    submitFiles: lang === 'en' ? 'Submit Documents' : 'إرسال المستندات',
    clearingAgent: lang === 'en' ? 'Customs Agent' : 'المخلص الجمركي',
    filesUploaded: lang === 'en' ? 'Files uploaded successfully.' : 'تم رفع الملفات بنجاح.',
    noFees: lang === 'en' ? 'No fees due at this time.' : 'لا توجد رسوم مستحقة في هذا الوقت.',
    
    services: {
        jordan_green: lang === 'en' ? 'Jordanian Services (Green ID)' : 'الخدمات الأردنية (هوية خضراء)',
        jordan_blue: lang === 'en' ? 'Jordanian Services (Blue ID)' : 'الخدمات الأردنية (هوية زرقاء)',
        cod: lang === 'en' ? 'COD Amount Remittance' : 'تحويل مبالغ الدفع عند الاستلام',
        invoice: lang === 'en' ? 'Monthly Invoice' : 'الفاتورة الشهرية',
        customs: lang === 'en' ? 'Customs Clearance' : 'التخليص الجمركي',
        clearance_downpayment: lang === 'en' ? 'Clearance (Downpayment)' : 'تخليص (دفعة مقدمة)'
    }
  };

  const checkStatus = (ref: string, service: ServiceType) => {
    setLoading(true);
    setError('');
    setUploadedFiles([]); // Reset files
    setBillDetails(undefined);
    
    // Simulate API lookup
    setTimeout(() => {
        // Mock Error Logic
        if (ref.endsWith('0')) {
            setError(t.errorRef);
            setLoading(false);
            return;
        }

        // CUSTOMS CLEARANCE LOGIC
        if (service === 'customs') {
            // Mock Scenarios based on input ending
            if (ref.endsWith('1')) {
                // Scenario: Files Required, No Fee
                setRequiredFiles(['Commercial Invoice', 'National ID Copy']);
                setRetrievedAmount(0);
                setStep('upload');
            } else if (ref.endsWith('2')) {
                // Scenario: No Files, Fee Required
                setRequiredFiles([]);
                setRetrievedAmount(250.00); // Fixed mock fee
                setStep('confirm');
            } else {
                // Scenario: Both Required (Default for other numbers in customs)
                setRequiredFiles(['Import License', 'Packing List']);
                setRetrievedAmount(185.50);
                setStep('upload');
            }
        } 
        // CLEARANCE DOWNPAYMENT LOGIC
        else if (service === 'clearance_downpayment') {
             setRequiredFiles([]);
             // Mock retrieval for manual lookup
             const mockAmount = 350.00;
             setRetrievedAmount(mockAmount);
             setBillDetails([
                 { label: lang === 'en' ? 'Estimated Customs Duty' : 'تقدير الرسوم الجمركية', amount: 300.00 },
                 { label: lang === 'en' ? 'File Opening Fee' : 'رسوم فتح ملف', amount: 50.00 }
             ]);
             setStep('confirm');
        }
        // OTHER SERVICES LOGIC
        else {
            setRequiredFiles([]);
            const mockPrice = 50 + (ref.length * 12.5);
            setRetrievedAmount(mockPrice);
            setStep('confirm');
        }
        
        setLoading(false);
    }, 1200);
  };

  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) return;
    checkStatus(referenceNumber, selectedService);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const removeFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitDocuments = () => {
      setLoading(true);
      // Simulate upload delay
      setTimeout(() => {
          setLoading(false);
          // If there is a fee, go to pay, else success
          if (retrievedAmount && retrievedAmount > 0) {
              setStep('confirm');
          } else {
              setStep('success');
          }
      }, 1000);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Payment Gateway
    setTimeout(() => {
        setLoading(false);
        setStep('success');
    }, 1500);
  };

  const reset = () => {
      setStep('search');
      setReferenceNumber('');
      setRetrievedAmount(null);
      setRequiredFiles([]);
      setUploadedFiles([]);
      setBillDetails(undefined);
      setSelectedService('jordan_green');
  };

  return (
    <div className={isPopup ? "w-full p-2" : "max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8"}>
      <div className={`text-center ${isPopup ? 'mb-6' : 'mb-10'}`}>
        <h2 className={`font-extrabold text-wassel-blue ${isPopup ? 'text-2xl' : 'text-3xl'}`}>{t.title}</h2>
        <p className="mt-4 text-gray-500 text-sm sm:text-base">{t.subtitle}</p>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        
        {/* Step 1: Search */}
        {step === 'search' && (
            <div className="p-8">
                <form onSubmit={handleRetrieve} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectService}</label>
                        <div className="relative">
                            <select
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                                className="block w-full pl-3 rtl:pl-10 pr-10 rtl:pr-3 py-3 text-base border-gray-300 focus:outline-none focus:ring-wassel-yellow focus:border-wassel-yellow sm:text-sm rounded-md border"
                            >
                                <option value="customs">{t.services.customs}</option>
                                <option value="clearance_downpayment">{t.services.clearance_downpayment}</option>
                                <option value="jordan_green">{t.services.jordan_green}</option>
                                <option value="jordan_blue">{t.services.jordan_blue}</option>
                                <option value="cod">{t.services.cod}</option>
                                <option value="invoice">{t.services.invoice}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.refNumber}</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="focus:ring-wassel-yellow focus:border-wassel-yellow block w-full ltr:pl-10 rtl:pr-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                placeholder={t.refPlaceholder}
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4 flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 rtl:mr-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow disabled:opacity-70 transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                {t.searching}
                            </>
                        ) : t.retrieve}
                    </button>
                </form>
            </div>
        )}

        {/* Step 2: Upload Files (Only for Customs if files required) */}
        {step === 'upload' && (
            <div className="p-8">
                <button 
                    onClick={() => setStep('search')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
                >
                    <ArrowLeft className="w-4 h-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" /> {t.back}
                </button>

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{t.uploadTitle}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t.uploadDesc}</p>
                    
                    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3 rtl:mr-3">
                                <p className="text-sm text-blue-700 font-bold">
                                    {requiredFiles.join(' • ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-wassel-blue hover:text-wassel-darkBlue focus-within:outline-none">
                                <span>{t.dragDrop}</span>
                                <input ref={fileInputRef} type="file" className="sr-only" multiple onChange={handleFileUpload} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">{t.supportedFiles}</p>
                    </div>
                </div>

                {/* File List */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-6 space-y-2">
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                                <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-gray-400 ltr:mr-3 rtl:ml-3" />
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                                </div>
                                <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                     <button
                        onClick={submitDocuments}
                        disabled={uploadedFiles.length === 0 || loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-wassel-blue hover:bg-wassel-darkBlue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow disabled:opacity-50 transition-colors"
                    >
                         {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                {t.processing}
                            </>
                        ) : t.submitFiles}
                    </button>
                </div>
            </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 'confirm' && retrievedAmount !== null && (
            <div className="p-8 animate-enter">
                 {/* Back Logic depending on previous step */}
                 <button 
                    onClick={() => {
                        // If user came via link with prefilled data, probably shouldn't go back to search
                        if(initialParams?.billDetails && initialParams.billDetails.length > 0) return; 
                        setStep(requiredFiles.length > 0 ? 'upload' : 'search');
                    }}
                    className={`flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 ${initialParams?.billDetails ? 'hidden' : ''}`}
                 >
                     <ArrowLeft className="w-4 h-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" /> {t.back}
                 </button>

                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-sm">{t.service}</span>
                        <span className="font-medium text-wassel-blue text-sm text-right">{t.services[selectedService]}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                         <span className="text-gray-500 text-sm">{t.refNumber}</span>
                         <span className="font-bold text-gray-900">{referenceNumber}</span>
                    </div>
                    
                    {/* Detailed Bill Breakdown */}
                    {billDetails && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-3">{t.breakdownTitle}</h4>
                            <div className="space-y-2">
                                {billDetails.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.label}</span>
                                        <span className="font-medium text-gray-900">{item.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show file success if coming from upload */}
                    {uploadedFiles.length > 0 && (
                        <div className="flex items-center mb-4 text-sm text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                            {t.filesUploaded}
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">{t.amountDue}</span>
                        <span className="text-2xl font-bold text-green-600">{retrievedAmount.toFixed(2)} <span className="text-sm text-gray-500">ILS</span></span>
                    </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-6">
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{t.cardInfo}</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">{t.cardNum}</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                        <CreditCard className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" required placeholder="0000 0000 0000 0000" className="focus:ring-wassel-yellow focus:border-wassel-yellow block w-full ltr:pl-10 rtl:pr-10 sm:text-sm border-gray-300 rounded-md border py-2" />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">{t.expiry}</label>
                                <input type="text" required placeholder="MM / YY" className="mt-1 focus:ring-wassel-yellow focus:border-wassel-yellow block w-full sm:text-sm border-gray-300 rounded-md border py-2 px-3" />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">{t.cvc}</label>
                                <input type="text" required placeholder="123" className="mt-1 focus:ring-wassel-yellow focus:border-wassel-yellow block w-full sm:text-sm border-gray-300 rounded-md border py-2 px-3" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
                    >
                         {loading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                {t.processing}
                            </>
                        ) : t.payNow}
                    </button>
                </form>
            </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
            <div className="p-8 text-center animate-pop">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h3>
                <p className="text-gray-500 mb-8">{t.successDesc}</p>

                <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto mb-8 border border-gray-200">
                     <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500 text-sm">{t.service}</span>
                        <span className="font-medium text-gray-900 text-sm">{t.services[selectedService]}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500 text-sm">{t.refNumber}</span>
                        <span className="font-medium text-gray-900 text-sm">{referenceNumber}</span>
                    </div>
                    {/* Show file status in receipt if applicable */}
                    {uploadedFiles.length > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500 text-sm">{t.clearingAgent}</span>
                            <span className="font-medium text-green-600 text-sm">{t.filesUploaded}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2">
                        <span className="text-gray-500 text-sm">{t.transId}</span>
                        <span className="font-medium text-gray-900 text-sm">TRX-{Math.floor(Math.random() * 1000000)}</span>
                    </div>
                </div>

                <button
                    onClick={reset}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-wassel-blue bg-wassel-yellow hover:bg-wassel-lightYellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wassel-yellow"
                >
                    {t.newPayment}
                </button>
            </div>
        )}

      </div>
    </div>
  );
};