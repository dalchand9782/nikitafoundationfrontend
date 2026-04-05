import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLoan, formatApiError } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  User,
  UserCheck,
  IndianRupee,
  Calendar as CalendarIcon,
  Upload,
  Save,
  X,
  Camera,
  AlertTriangle
} from 'lucide-react';

export default function CreateLoanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    borrower_name: '',
    borrower_father_name: '',
    borrower_mobile: '',
    borrower_email: '',
    borrower_address: '',
    loan_amount: '',
    total_payable_amount: '',
    emi_amount: '',
    total_emi: 100,
    borrow_date: new Date(),
    guarantor_name: '',
    guarantor_father_name: '',
    guarantor_mobile: '',
    borrower_signature: null,
    guarantor_signature: null,
    borrower_photo: null,
    loan_disbursement_name: '',
    emi_penalty_amount: 100
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.borrower_name || !formData.borrower_mobile || !formData.borrower_email) {
      toast.error('Please fill in all required borrower details');
      return;
    }
    if (!formData.loan_amount || !formData.total_payable_amount || !formData.emi_amount) {
      toast.error('Please fill in all loan amount details');
      return;
    }
    if (!formData.guarantor_name || !formData.guarantor_mobile) {
      toast.error('Please fill in guarantor details');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        loan_amount: parseFloat(formData.loan_amount),
        total_payable_amount: parseFloat(formData.total_payable_amount),
        emi_amount: parseFloat(formData.emi_amount),
        total_emi: parseInt(formData.total_emi),
        emi_penalty_amount: parseFloat(formData.emi_penalty_amount) || 100,
        borrow_date: format(formData.borrow_date, 'yyyy-MM-dd')
      };

      const response = await createLoan(payload);
      toast.success(`Loan created successfully! Application No: ${response.data.loan.application_number}`);
      navigate('/loans');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loans')} data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-800">
            Create Loan Application
          </h1>
          <p className="text-stone-500">Fill in the details to create a new loan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Borrower Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-forest-600" />
              Borrower Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Borrower Photo */}
            <div className="space-y-2">
              <Label>Borrower Photo</Label>
              {formData.borrower_photo ? (
                <div className="relative inline-block">
                  <img src={formData.borrower_photo} alt="Borrower" className="h-32 w-32 object-cover border rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removeFile('borrower_photo')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-forest-500 transition-colors bg-stone-50">
                  <Camera className="h-8 w-8 text-stone-400 mb-2" />
                  <span className="text-xs text-stone-500">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'borrower_photo')}
                    data-testid="borrower-photo-input"
                  />
                </label>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="borrower_name">Full Name *</Label>
                <Input
                  id="borrower_name"
                  name="borrower_name"
                  placeholder="Enter borrower's full name"
                  value={formData.borrower_name}
                  onChange={handleInputChange}
                  data-testid="borrower-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrower_father_name">Father's/Husband's Name *</Label>
                <Input
                  id="borrower_father_name"
                  name="borrower_father_name"
                  placeholder="Enter father's/husband's name"
                  value={formData.borrower_father_name}
                  onChange={handleInputChange}
                  data-testid="borrower-father-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrower_mobile">Mobile Number *</Label>
                <Input
                  id="borrower_mobile"
                  name="borrower_mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.borrower_mobile}
                  onChange={handleInputChange}
                  data-testid="borrower-mobile-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrower_email">Email *</Label>
                <Input
                  id="borrower_email"
                  name="borrower_email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.borrower_email}
                  onChange={handleInputChange}
                  data-testid="borrower-email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrower_address">Address *</Label>
              <Textarea
                id="borrower_address"
                name="borrower_address"
                placeholder="Enter complete address"
                value={formData.borrower_address}
                onChange={handleInputChange}
                rows={3}
                data-testid="borrower-address-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Borrower Signature (Optional)</Label>
              {formData.borrower_signature ? (
                <div className="relative inline-block">
                  <img src={formData.borrower_signature} alt="Signature" className="h-24 border rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeFile('borrower_signature')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-forest-500 transition-colors">
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto text-stone-400" />
                    <p className="text-sm text-stone-500 mt-1">Click to upload signature</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'borrower_signature')}
                    data-testid="borrower-signature-input"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-forest-600" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_amount">Loan Amount (₹) *</Label>
                <Input
                  id="loan_amount"
                  name="loan_amount"
                  type="number"
                  placeholder="Enter loan amount"
                  value={formData.loan_amount}
                  onChange={handleInputChange}
                  data-testid="loan-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_payable_amount">Total Payable (₹) *</Label>
                <Input
                  id="total_payable_amount"
                  name="total_payable_amount"
                  type="number"
                  placeholder="Enter total payable"
                  value={formData.total_payable_amount}
                  onChange={handleInputChange}
                  data-testid="total-payable-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emi_amount">EMI Amount (₹) *</Label>
                <Input
                  id="emi_amount"
                  name="emi_amount"
                  type="number"
                  placeholder="Enter EMI amount"
                  value={formData.emi_amount}
                  onChange={handleInputChange}
                  data-testid="emi-amount-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_emi">Total EMI Count</Label>
                <Input
                  id="total_emi"
                  name="total_emi"
                  type="number"
                  value={formData.total_emi}
                  onChange={handleInputChange}
                  data-testid="total-emi-input"
                />
              </div>
            </div>

            {/* EMI Penalty Section */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="emi_penalty_amount" className="text-red-700 font-semibold">
                    EMI Due Penalty Amount (₹)
                  </Label>
                  <p className="text-xs text-red-600 mb-2">
                    This penalty will be added if EMI payment is overdue
                  </p>
                  <Input
                    id="emi_penalty_amount"
                    name="emi_penalty_amount"
                    type="number"
                    placeholder="100"
                    value={formData.emi_penalty_amount}
                    onChange={handleInputChange}
                    className="max-w-[200px] border-red-200 focus:border-red-400"
                    data-testid="emi-penalty-input"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="borrow-date-button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.borrow_date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.borrow_date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, borrow_date: date || new Date() }));
                        setDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_disbursement_name">Disbursement Name *</Label>
                <Input
                  id="loan_disbursement_name"
                  name="loan_disbursement_name"
                  placeholder="Enter disbursement name"
                  value={formData.loan_disbursement_name}
                  onChange={handleInputChange}
                  data-testid="disbursement-name-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guarantor Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-forest-600" />
              Guarantor Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guarantor_name">Full Name *</Label>
                <Input
                  id="guarantor_name"
                  name="guarantor_name"
                  placeholder="Enter guarantor's full name"
                  value={formData.guarantor_name}
                  onChange={handleInputChange}
                  data-testid="guarantor-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guarantor_father_name">Father's Name *</Label>
                <Input
                  id="guarantor_father_name"
                  name="guarantor_father_name"
                  placeholder="Enter father's name"
                  value={formData.guarantor_father_name}
                  onChange={handleInputChange}
                  data-testid="guarantor-father-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guarantor_mobile">Mobile Number *</Label>
                <Input
                  id="guarantor_mobile"
                  name="guarantor_mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.guarantor_mobile}
                  onChange={handleInputChange}
                  data-testid="guarantor-mobile-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Guarantor Signature (Optional)</Label>
              {formData.guarantor_signature ? (
                <div className="relative inline-block">
                  <img src={formData.guarantor_signature} alt="Signature" className="h-24 border rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeFile('guarantor_signature')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-forest-500 transition-colors">
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto text-stone-400" />
                    <p className="text-sm text-stone-500 mt-1">Click to upload signature</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'guarantor_signature')}
                    data-testid="guarantor-signature-input"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/loans')}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-forest-500 hover:bg-forest-600"
            data-testid="create-loan-submit-button"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Loan Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
