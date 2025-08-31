// src/utils/helpers.js

export const dayNamesVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export const formatDateForModal = (dateString) => {
  if (!dateString) return 'Someday';
  const date = new Date(dateString);
  return `${dayNamesVi[date.getDay()]}, Ngày ${date.getDate()} Tháng ${date.getMonth() + 1} Năm ${date.getFullYear()}`;
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};