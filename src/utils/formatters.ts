export const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ar-EG-u-nu-latn', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true
  });
};

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US') + ' ج.م';
};

export const getMethodName = (method: string) => {
  switch(method) {
    case 'cash': return 'نقدي (الدرج)';
    case 'vodafone': return 'فودافون كاش';
    case 'instapay': return 'انستا باي';
    case 'bank': return 'تحويل بنكي';
    default: return method;
  }
};

export const getCategoryNameAr = (cat: string) => {
  switch(cat) {
    case 'accessories': return 'الإكسسوارات';
    case 'hardware': return 'قطع الغيار';
    case 'maintenance': return 'الصيانة';
    case 'software': return 'السوفت وير';
    case 'finance': return 'الخدمات المالية';
    default: return cat;
  }
};
