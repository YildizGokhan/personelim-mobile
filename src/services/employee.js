import { getToken } from "./storage";

// Backend API base URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://personelim-be.vercel.app";

console.log("Employee service - API_BASE_URL:", API_BASE_URL);

// Helper function to get authorization headers
const getAuthHeaders = async () => {
  const token = await getToken();
  console.log("Employee service - Token:", token ? "Token var" : "Token yok");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Employee API servisleri

// Tüm personelleri getir (sadece owner/manager için)
export const getAllEmployees = async (
  page = 1,
  limit = 10,
  department = null,
  search = null
) => {
  try {
    console.log("Employee service - getAllEmployees başlatılıyor");
    const headers = await getAuthHeaders();
    console.log("Employee service - Headers:", headers);

    let url = `${API_BASE_URL}/employees?page=${page}&limit=${limit}`;

    if (department) {
      url += `&department=${encodeURIComponent(department)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    console.log("Employee service - Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    console.log("Employee service - Response status:", response.status);
    console.log("Employee service - Response ok:", response.ok);

    const data = await response.json();
    console.log("Employee service - Response data:", data);

    if (response.ok) {
      const payload = data?.data ?? data ?? {};
      let employees = [];

      if (Array.isArray(payload)) {
        employees = payload;
      } else if (Array.isArray(payload.employees)) {
        employees = payload.employees;
      } else if (Array.isArray(payload.items)) {
        employees = payload.items;
      } else if (Array.isArray(payload.results)) {
        employees = payload.results;
      } else if (payload.employees && typeof payload.employees === "object") {
        employees = Object.values(payload.employees);
      } else if (payload.data && Array.isArray(payload.data.employees)) {
        employees = payload.data.employees;
      } else if (Array.isArray(payload.data)) {
        employees = payload.data;
      }

      const pagination =
        payload.pagination ||
        payload.meta ||
        payload.pageInfo ||
        payload.data?.pagination ||
        {};

      const total =
        payload.total ??
        payload.count ??
        payload.totalCount ??
        pagination.total ??
        pagination.count ??
        pagination.totalCount ??
        employees.length;

      console.log(
        "Employee service - Success, employees length:",
        employees.length
      );

      return {
        success: true,
        data: {
          employees,
          pagination,
          total,
        },
      };
    } else {
      console.log("Employee service - Error:", data.message || data.error);
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get employees error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Personel istatistiklerini getir
export const getEmployeeStatistics = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/statistics`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        statistics: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get employee statistics error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Mevcut çalışanın kendi bilgilerini getir (sadece employee için)
export const getCurrentEmployeeData = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/me`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      const employeePayload =
        data?.data?.employee ||
        data?.data?.createdEmployee ||
        data?.data ||
        data?.employee ||
        data;

      return {
        success: true,
        employee: employeePayload,
        meta: data?.meta || data?.data?.meta || null,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get current employee data error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

const extractEmployeeId = (payload) => {
  if (!payload) return null;
  const employee = payload.employee || payload.data || payload;
  if (!employee) return null;
  return employee.id || employee._id || employee.employeeId || null;
};

const resolveCurrentEmployeeId = async () => {
  const profileResult = await getCurrentEmployeeData();
  if (!profileResult.success) {
    return {
      success: false,
      error: profileResult.error || "Çalışan bilgileri alınamadı",
    };
  }

  const employeeId = extractEmployeeId(profileResult);

  if (!employeeId) {
    return {
      success: false,
      error: "Çalışan kimliği bulunamadı",
    };
  }

  return {
    success: true,
    employeeId,
  };
};

// Çalışanın kendi mesai kayıtlarını getir
export const getMyTimesheets = async (
  page = 1,
  limit = 10,
  startDate = null,
  endDate = null
) => {
  try {
    const { success, error, employeeId } = await resolveCurrentEmployeeId();
    if (!success) {
      return { success: false, error };
    }

    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/employees/${employeeId}/timesheets?page=${page}&limit=${limit}`;

    if (startDate) {
      url += `&startDate=${encodeURIComponent(startDate)}`;
    }

    if (endDate) {
      url += `&endDate=${encodeURIComponent(endDate)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data ?? data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get timesheets error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışan için mesai kaydı oluştur
export const createTimesheetEntry = async (timesheetData) => {
  try {
    const { success, error, employeeId } = await resolveCurrentEmployeeId();
    if (!success) {
      return { success: false, error };
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/timesheets`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(timesheetData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        timesheet: data.data ?? data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Create timesheet error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın mesai kaydını güncelle
export const updateTimesheetEntry = async (timesheetId, timesheetData) => {
  try {
    const { success, error, employeeId } = await resolveCurrentEmployeeId();
    if (!success) {
      return { success: false, error };
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/timesheets/${timesheetId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(timesheetData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        timesheet: data.data ?? data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update timesheet error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın mesai kaydını sil
export const deleteTimesheetEntry = async (timesheetId) => {
  try {
    const { success, error, employeeId } = await resolveCurrentEmployeeId();
    if (!success) {
      return { success: false, error };
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/timesheets/${timesheetId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || "Mesai kaydı silindi",
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Delete timesheet error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Mevcut çalışanın kendi bilgilerini güncelle (sadece employee için)
export const updateCurrentEmployeeData = async (updateData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      const employeePayload =
        data?.data?.employee ||
        data?.data?.updatedEmployee ||
        data?.data ||
        data?.employee ||
        data;

      return {
        success: true,
        employee: employeePayload,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update current employee data error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Yeni personel ekle
export const createEmployee = async (employeeData) => {
  try {
    console.log(
      "Creating employee with data:",
      JSON.stringify(employeeData, null, 2)
    );
    const headers = await getAuthHeaders();
    console.log("Headers:", headers);

    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: "POST",
      headers,
      body: JSON.stringify(employeeData),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return { success: false, error: "Geçersiz sunucu yanıtı" };
    }

    console.log("Parsed response data:", data);

    if (response.ok) {
      const employeePayload =
        data?.data?.employee ||
        data?.data?.restoredEmployee ||
        data?.data ||
        data?.employee ||
        data;

      return {
        success: true,
        employee: employeePayload,
      };
    } else {
      console.error("Server error:", data);
      return {
        success: false,
        error: data.message || data.error || "Bilinmeyen sunucu hatası",
      };
    }
  } catch (error) {
    console.error("Create employee error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
}; // Personel bilgilerini güncelle
export const updateEmployee = async (employeeId, updateData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      const employeePayload =
        data?.data?.employee ||
        data?.data ||
        data?.employee ||
        data;

      return {
        success: true,
        employee: employeePayload,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update employee error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Personeli sil (soft delete)
export const deleteEmployee = async (employeeId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Delete employee error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Personel detaylarını getir
export const getEmployeeById = async (employeeId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        employee: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get employee error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Silinmiş personelleri getir
export const getDeletedEmployees = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/employees/deleted`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      const payload = data?.data ?? data ?? {};
      return {
        success: true,
        data: payload,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get deleted employees error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Silinmiş personeli geri yükle
export const restoreEmployee = async (employeeId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/restore`,
      {
        method: "POST", // Backend'de POST olarak değişti
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        employee: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Restore employee error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Personel için kullanıcı hesabı oluştur
export const createEmployeeUser = async (employeeId, email, password) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/auth/register-employee`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        employeeId,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Create employee user error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın kendi izin kayıtlarını getir
export const getMyLeaves = async (
  page = 1,
  limit = 10,
  status = null,
  type = null,
  approved = null
) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    let url = `${API_BASE_URL}/employees/${employeeId}/leaves?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    if (approved !== null) {
      url += `&approved=${approved}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get my leaves error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın izin istatistiklerini getir
export const getMyLeaveStatistics = async (year = null) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    let url = `${API_BASE_URL}/employees/${employeeId}/leaves/statistics`;

    if (year) {
      url += `?year=${year}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get my leave statistics error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın izin talebi oluştur
export const createLeaveRequest = async (leaveData) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/leaves`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(leaveData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        leave: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Create leave request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Specific izin kaydını getir
export const getLeaveById = async (leaveId) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/leaves/${leaveId}`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get leave by id error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// İzin talebini güncelle (sadece pending olanlar)
export const updateLeaveRequest = async (leaveId, leaveData) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/leaves/${leaveId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(leaveData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update leave request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// İzin talebini sil (sadece pending olanlar)
export const deleteLeaveRequest = async (leaveId) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/leaves/${leaveId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Delete leave request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Manager/Owner: Çalışanın izinlerini getir
export const getEmployeeLeaves = async (
  employeeId,
  page = 1,
  limit = 10,
  status = null,
  type = null,
  approved = null
) => {
  try {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/employees/${employeeId}/leaves?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    if (approved !== null) {
      url += `&approved=${approved}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get employee leaves error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Manager/Owner: İzin onaylama/reddetme
export const approveLeaveRequest = async (
  employeeId,
  leaveId,
  status,
  approvalNote = null
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/leaves/${leaveId}/approve`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status,
          approvalNote,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Approve leave request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın kendi avans taleplerini getir
export const getMyAdvances = async (page = 1, limit = 10, status = null) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    let url = `${API_BASE_URL}/employees/${employeeId}/advances?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get my advances error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın avans istatistiklerini getir
export const getMyAdvanceStatistics = async (year = null) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    let url = `${API_BASE_URL}/employees/${employeeId}/advances/statistics`;

    if (year) {
      url += `?year=${year}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get my advance statistics error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Çalışanın avans talebi oluştur
export const createAdvanceRequest = async (advanceData) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/advances`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(advanceData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        advance: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Create advance request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Specific avans kaydını getir
export const getAdvanceById = async (advanceId) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/advances/${advanceId}`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get advance by id error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Avans talebini güncelle (sadece pending olanlar)
export const updateAdvanceRequest = async (advanceId, advanceData) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/advances/${advanceId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(advanceData),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Update advance request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Avans talebini sil (sadece pending olanlar)
export const deleteAdvanceRequest = async (advanceId) => {
  try {
    const headers = await getAuthHeaders();

    // Önce kendi bilgilerini al
    const userResponse = await getCurrentEmployeeData();
    if (!userResponse.success || !userResponse.data?.id) {
      return { success: false, error: "Kullanıcı bilgileri alınamadı" };
    }

    const employeeId = userResponse.data.id;
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/advances/${advanceId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Delete advance request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Manager/Owner: Çalışanın avanslarını getir
export const getEmployeeAdvances = async (
  employeeId,
  page = 1,
  limit = 10,
  status = null
) => {
  try {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/employees/${employeeId}/advances?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Get employee advances error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};

// Manager/Owner: Avans onaylama/reddetme
export const approveAdvanceRequest = async (
  employeeId,
  advanceId,
  status,
  approvalNote = null
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/advances/${advanceId}/approve`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status,
          approvalNote,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error("Approve advance request error:", error);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }
};
