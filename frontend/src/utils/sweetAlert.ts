import Swal, { type SweetAlertIcon } from 'sweetalert2';

// ธีมราชการทันสมัย อบต.โป่งน้ำร้อน (Modern Emerald Thai Gov Theme)
const customClass = {
  popup: 'rounded-3xl shadow-2xl border border-slate-100 p-6 font-sans',
  title: 'text-lg font-bold text-slate-900 font-heading',
  htmlContainer: 'text-sm text-slate-600 leading-relaxed',
  confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all mx-1.5 cursor-pointer',
  cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all mx-1.5 cursor-pointer',
  denyButton: 'px-5 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all mx-1.5 cursor-pointer',
};

/**
 * Toast แจ้งเตือนมุมขวาบน แบบเรียบหรู ปิดอัตโนมัติ
 */
export const showToast = (title: string, icon: SweetAlertIcon = 'success', timer = 3000) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-emerald-100 bg-white/95 backdrop-blur-sm text-xs font-semibold py-3 px-4 font-sans',
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  return Toast.fire({
    icon,
    title
  });
};

/**
 * กล่องข้อความแจ้งเตือนความสำเร็จ (Success Modal)
 */
export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'ตกลง',
    buttonsStyling: false,
    customClass,
    iconColor: '#10b981'
  });
};

/**
 * กล่องข้อความแจ้งเตือนข้อผิดพลาด (Error Modal)
 */
export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'รับทราบ',
    buttonsStyling: false,
    customClass,
    iconColor: '#ef4444'
  });
};

/**
 * กล่องข้อความแจ้งเตือนข้อมูล / เตือนทั่วไป (Warning Modal)
 */
export const showWarningAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'เข้าใจแล้ว',
    buttonsStyling: false,
    customClass,
    iconColor: '#f59e0b'
  });
};

/**
 * กล่องยืนยันการทำรายการ (Confirmation Modal)
 * คืนค่า Promise<boolean> -> true หากกดยืนยัน
 */
export const showConfirmDialog = async (options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
  isDanger?: boolean;
}): Promise<boolean> => {
  const {
    title,
    text,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    icon = 'question',
    isDanger = false
  } = options;

  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    buttonsStyling: false,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      ...customClass,
      confirmButton: isDanger
        ? 'px-5 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all mx-1.5 cursor-pointer'
        : customClass.confirmButton
    },
    iconColor: isDanger ? '#ef4444' : icon === 'warning' ? '#f59e0b' : '#10b981'
  });

  return result.isConfirmed;
};

export default Swal;
