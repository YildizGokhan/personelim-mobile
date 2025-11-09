import { create } from "zustand";
import {
  getAllEmployees,
  getEmployeeStatistics,
  getCurrentEmployeeData,
  updateCurrentEmployeeData,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  getDeletedEmployees,
  restoreEmployee,
  createEmployeeUser,
  getMyLeaves,
  getMyLeaveStatistics,
  createLeaveRequest,
  getLeaveById,
  updateLeaveRequest,
  deleteLeaveRequest,
  getMyAdvances,
  getMyAdvanceStatistics,
  createAdvanceRequest,
  getAdvanceById,
  updateAdvanceRequest,
  deleteAdvanceRequest,
  getEmployeeLeaves,
  approveLeaveRequest,
  getEmployeeAdvances,
  approveAdvanceRequest,
  getMyTimesheets,
  createTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  getEmployeeTimesheets,
  approveTimesheetEntry,
} from "../services/employee";

const getTimesheetIdentifier = (entry) =>
  entry?.id || entry?._id || entry?.timesheetId || entry?.uuid || entry?.code;

const parseTimeToMinutes = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  const normalized =
    typeof value === "string" ? value.trim() : String(value).trim();

  if (/^\d{2}:\d{2}$/.test(normalized)) {
    const [hour, minute] = normalized.split(":").map(Number);
    return hour * 60 + minute;
  }

  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date.getHours() * 60 + date.getMinutes();
  }

  return null;
};

const calculateTotalHours = (startTime, endTime, breakMinutes = 0) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes) ||
    endMinutes <= startMinutes
  ) {
    return null;
  }

  const breakValue = Number(breakMinutes) || 0;
  const durationMinutes = Math.max(endMinutes - startMinutes - breakValue, 0);
  return Number((durationMinutes / 60).toFixed(2));
};

const normalizeTimesheetEntry = (entry, fallback = {}) => {
  if (!entry) return entry;

  const startTime =
    entry.startTime ??
    entry.clockIn ??
    entry.inTime ??
    fallback.startTime ??
    fallback.clockIn ??
    fallback.inTime ??
    null;

  const endTime =
    entry.endTime ??
    entry.clockOut ??
    entry.outTime ??
    fallback.endTime ??
    fallback.clockOut ??
    fallback.outTime ??
    null;

  const breakMinutesRaw =
    entry.breakMinutes ??
    entry.breakDuration ??
    entry.breakTime ??
    fallback.breakMinutes ??
    fallback.breakDuration ??
    fallback.breakTime ??
    null;

  const totalHoursRaw =
    entry.totalHours ??
    entry.workedHours ??
    entry.hours ??
    entry.durationHours ??
    fallback.totalHours ??
    fallback.workedHours ??
    fallback.hours ??
    fallback.durationHours;

  const totalHours =
    totalHoursRaw !== undefined &&
    totalHoursRaw !== null &&
    totalHoursRaw !== ""
      ? Number(totalHoursRaw)
      : calculateTotalHours(
          startTime,
          endTime,
          breakMinutesRaw !== null && breakMinutesRaw !== undefined
            ? breakMinutesRaw
            : 0
        );

  return {
    ...fallback,
    ...entry,
    startTime,
    endTime,
    breakMinutes:
      breakMinutesRaw !== null && breakMinutesRaw !== undefined
        ? Number(breakMinutesRaw)
        : undefined,
    totalHours: totalHours ?? undefined,
  };
};

const ensureTimesheetId = (entry) => {
  const identifier = getTimesheetIdentifier(entry);
  if (!identifier) return entry;
  if (entry.id === identifier) return entry;
  return { ...entry, id: identifier };
};

const normalizeTimesheetList = (entries = []) =>
  entries.map((entry) => ensureTimesheetId(normalizeTimesheetEntry(entry)));

const ensureEmployeeId = (employee) => {
  if (!employee) return employee;
  const candidateId =
    employee.id ||
    employee._id ||
    employee.employeeId ||
    employee.userId ||
    employee.uuid ||
    employee.guid;
  if (!candidateId) {
    return employee;
  }
  if (employee.id === candidateId) {
    return employee;
  }
  return { ...employee, id: candidateId };
};

const mapEmployeesWithIds = (employees = []) =>
  employees.map((employee) => ensureEmployeeId(employee));

const usePersonelStore = create((set, get) => ({
  // State
  personelList: [],
  deletedPersonelList: [],
  currentPersonel: null,
  statistics: null,
  myLeaves: [],
  myAdvances: [],
  myTimesheets: [],
  employeeTimesheets: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },

  timesheetPagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  timesheetReviewPagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  timesheetReviewLoading: false,

  // Actions
  setPersonelList: (personelList) => set({ personelList }),
  setDeletedPersonelList: (deletedPersonelList) => set({ deletedPersonelList }),
  setCurrentPersonel: (currentPersonel) => set({ currentPersonel }),
  setStatistics: (statistics) => set({ statistics }),
  setMyLeaves: (myLeaves) => set({ myLeaves }),
  setMyAdvances: (myAdvances) => set({ myAdvances }),
  setMyTimesheets: (myTimesheets) => set({ myTimesheets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPagination: (pagination) => set({ pagination }),
  setTimesheetPagination: (timesheetPagination) =>
    set({ timesheetPagination }),

  refreshStatistics: async () => {
    try {
      const result = await getEmployeeStatistics();
      if (result.success) {
        set({ statistics: result.statistics });
      }
    } catch (error) {
      // sessiz geç
      console.error("refreshStatistics error:", error);
    }
  },

  // Personel listesini getir (sayfalama ile)
  fetchPersonelList: async (
    page = 1,
    limit = 10,
    department = null,
    search = null
  ) => {
    console.log("PersonelStore - fetchPersonelList başlatılıyor");
    set({ isLoading: true, error: null });
    try {
      const result = await getAllEmployees(page, limit, department, search);
      console.log("PersonelStore - getAllEmployees result:", result);

      if (result.success) {
        const payload = result.data ?? {};
        let employees = payload.employees ?? [];

        if (!Array.isArray(employees)) {
          if (employees && typeof employees === "object") {
            employees = Object.values(employees);
          } else {
            employees = [];
          }
        }

        employees = mapEmployeesWithIds(employees);

        const pagination = payload.pagination ?? {};
        const total =
          payload.total ??
          pagination.total ??
          pagination.count ??
          pagination.totalCount ??
          employees.length;

        console.log(
          "PersonelStore - Result success, employees length:",
          employees.length
        );
        set({
          personelList: employees,
          pagination: {
            page,
            limit,
            total,
          },
          isLoading: false,
        });
        console.log("PersonelStore - State güncellendi");
        return { success: true };
      } else {
        console.log("PersonelStore - Result error:", result.error);
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log("PersonelStore - Catch error:", error.message);
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel istatistiklerini getir
  fetchStatistics: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getEmployeeStatistics();

      if (result.success) {
        set({
          statistics: result.statistics,
          isLoading: false,
        });
        return { success: true, statistics: result.statistics };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Mevcut çalışanın kendi bilgilerini getir
  fetchMyData: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getCurrentEmployeeData();

      if (result.success) {
        set({
          currentPersonel: result.employee,
          isLoading: false,
        });
        return { success: true, employee: result.employee };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Mevcut çalışanın kendi bilgilerini güncelle
  updateMyData: async (updateData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateCurrentEmployeeData(updateData);

      if (result.success) {
        set({
          currentPersonel: result.employee,
          isLoading: false,
        });
        return { success: true, employee: result.employee };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Silinmiş personelleri getir
  fetchDeletedPersonelList: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getDeletedEmployees(page, limit);

      if (result.success) {
        const payload = result.data ?? {};
        let employees = payload.employees ?? [];

        if (!Array.isArray(employees)) {
          if (employees && typeof employees === "object") {
            employees = Object.values(employees);
          } else {
            employees = [];
          }
        }

        employees = mapEmployeesWithIds(employees);

        set({
          deletedPersonelList: employees,
          isLoading: false,
        });
        return { success: true };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel ekle
  addPersonel: async (personelData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createEmployee(personelData);

      if (result.success) {
        const currentList = get().personelList;
        const createdEmployee = ensureEmployeeId(
          result.employee?.employee || result.employee
        );
        set({
          personelList: createdEmployee
            ? [...currentList, createdEmployee]
            : currentList,
          isLoading: false,
        });
        get().refreshStatistics();
        return { success: true, employee: createdEmployee };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel güncelle
  updatePersonel: async (id, personelData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateEmployee(id, personelData);

      if (result.success) {
        const currentList = get().personelList;
        const updatedEmployee = ensureEmployeeId(
          result.employee?.employee || result.employee
        );
        const matchId = (employee) => {
          const candidateId =
            employee.id || employee._id || employee.employeeId || employee.userId;
          return candidateId === id;
        };
        const updatedList = currentList.map((personel) =>
          matchId(personel) ? updatedEmployee : personel
        );
        set({
          personelList: updatedList,
          currentPersonel: updatedEmployee,
          isLoading: false,
        });
        get().refreshStatistics();
        return { success: true, employee: updatedEmployee };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel sil
  deletePersonel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteEmployee(id);

      if (result.success) {
        const currentList = get().personelList;
        const filteredList = currentList.filter((personel) => {
          const candidateId =
            personel.id || personel._id || personel.employeeId || personel.userId;
          return candidateId !== id;
        });
        set({
          personelList: filteredList,
          isLoading: false,
        });
        get().refreshStatistics();
        return { success: true };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel detaylarını getir
  fetchPersonelById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getEmployeeById(id);

      if (result.success) {
        set({
          currentPersonel: result.employee,
          isLoading: false,
        });
        return { success: true, employee: result.employee };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Silinmiş personeli geri yükle
  restorePersonel: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await restoreEmployee(id);

      if (result.success) {
        // Silinmiş listeden çıkar ve ana listeye ekle
        const currentDeletedList = get().deletedPersonelList;
        const currentList = get().personelList;

        const updatedDeletedList = currentDeletedList.filter((personel) => {
          const candidateId =
            personel.id || personel._id || personel.employeeId || personel.userId;
          return candidateId !== id;
        });
        const restoredEmployee = ensureEmployeeId(
          result.employee?.employee || result.employee
        );
        const updatedList = restoredEmployee
          ? [...currentList, restoredEmployee]
          : currentList;

        set({
          personelList: updatedList,
          deletedPersonelList: updatedDeletedList,
          isLoading: false,
        });
        get().refreshStatistics();
        return { success: true };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Personel için kullanıcı hesabı oluştur
  createPersonelUser: async (personelId, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createEmployeeUser(personelId, email, password);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, user: result.user };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  clearPersonelList: () =>
    set({
      personelList: [],
      deletedPersonelList: [],
      currentPersonel: null,
      statistics: null,
      myLeaves: [],
      myAdvances: [],
      myTimesheets: [],
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
      },
      timesheetPagination: {
        page: 1,
        limit: 10,
        total: 0,
      },
    }),

  // İzin yönetimi
  fetchMyLeaves: async (
    page = 1,
    limit = 10,
    status = null,
    type = null,
    approved = null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMyLeaves(page, limit, status, type, approved);

      if (result.success) {
        set({
          myLeaves: result.data.leaves || [],
          isLoading: false,
        });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  fetchMyLeaveStatistics: async (year = null) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMyLeaveStatistics(year);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  createLeave: async (leaveData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createLeaveRequest(leaveData);

      if (result.success) {
        const currentLeaves = get().myLeaves;
        set({
          myLeaves: [result.leave, ...currentLeaves],
          isLoading: false,
        });
        return { success: true, leave: result.leave };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  getLeaveById: async (leaveId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getLeaveById(leaveId);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateLeave: async (leaveId, leaveData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateLeaveRequest(leaveId, leaveData);

      if (result.success) {
        const currentLeaves = get().myLeaves;
        const updatedLeaves = currentLeaves.map((leave) =>
          leave.id === leaveId ? result.data : leave
        );
        set({
          myLeaves: updatedLeaves,
          isLoading: false,
        });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteLeave: async (leaveId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteLeaveRequest(leaveId);

      if (result.success) {
        const currentLeaves = get().myLeaves;
        const filteredLeaves = currentLeaves.filter(
          (leave) => leave.id !== leaveId
        );
        set({
          myLeaves: filteredLeaves,
          isLoading: false,
        });
        return { success: true, message: result.message };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Timesheet yönetimi
  fetchMyTimesheets: async (
    page = 1,
    limit = 10,
    startDate = null,
    endDate = null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMyTimesheets(page, limit, startDate, endDate);

      if (result.success) {
        const payload = result.data || {};
        const rawTimesheets = Array.isArray(payload)
          ? payload
          : payload.timesheets || payload.items || payload.records || [];
        const timesheets = normalizeTimesheetList(rawTimesheets);
        const total =
          payload.total ||
          payload.count ||
          payload.totalCount ||
          payload.pagination?.total ||
          timesheets.length;

        set({
          myTimesheets: timesheets,
          timesheetPagination: {
            page,
            limit,
            total,
          },
          isLoading: false,
        });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  createTimesheet: async (timesheetData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createTimesheetEntry(timesheetData);

      if (result.success) {
        const currentTimesheets = get().myTimesheets;
        const fallback = {
          ...timesheetData,
          breakMinutes:
            timesheetData?.breakMinutes !== undefined &&
            timesheetData?.breakMinutes !== null &&
            timesheetData?.breakMinutes !== ""
              ? Number(timesheetData.breakMinutes)
              : undefined,
        };
        const normalized = ensureTimesheetId(
          normalizeTimesheetEntry(result.timesheet, fallback)
        );
        set({
          myTimesheets: [normalized, ...currentTimesheets],
          isLoading: false,
        });
        return { success: true, timesheet: normalized };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateTimesheet: async (timesheetId, timesheetData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateTimesheetEntry(timesheetId, timesheetData);

      if (result.success) {
        const currentTimesheets = get().myTimesheets;
        const fallback = {
          ...timesheetData,
          breakMinutes:
            timesheetData?.breakMinutes !== undefined &&
            timesheetData?.breakMinutes !== null &&
            timesheetData?.breakMinutes !== ""
              ? Number(timesheetData.breakMinutes)
              : undefined,
        };
        const normalized = ensureTimesheetId(
          normalizeTimesheetEntry(result.timesheet, fallback)
        );
        const updatedTimesheets = currentTimesheets.map((timesheet) =>
          getTimesheetIdentifier(timesheet) === timesheetId
            ? normalized
            : timesheet
        );
        set({
          myTimesheets: updatedTimesheets,
          isLoading: false,
        });
        return { success: true, timesheet: normalized };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteTimesheet: async (timesheetId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteTimesheetEntry(timesheetId);

      if (result.success) {
        const currentTimesheets = get().myTimesheets;
        const filtered = currentTimesheets.filter(
          (timesheet) => getTimesheetIdentifier(timesheet) !== timesheetId
        );
        set({
          myTimesheets: filtered,
          isLoading: false,
        });
        return { success: true, message: result.message };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  fetchEmployeeTimesheets: async (
    employeeId,
    page = 1,
    limit = 10,
    status = null
  ) => {
    set({ timesheetReviewLoading: true, error: null });
    try {
      const result = await getEmployeeTimesheets(employeeId, page, limit, status);

      if (result.success) {
        const payload = result.data ?? {};
        const rawTimesheets = Array.isArray(payload.timesheets)
          ? payload.timesheets
          : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.records)
          ? payload.records
          : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        const timesheets = normalizeTimesheetList(rawTimesheets);

        const pagination =
          payload.pagination || payload.meta || payload.pageInfo || {};

        const total =
          payload.total ??
          pagination.total ??
          pagination.count ??
          pagination.totalCount ??
          timesheets.length;

        set({
          employeeTimesheets: timesheets,
          timesheetReviewPagination: {
            page,
            limit,
            total,
          },
          timesheetReviewLoading: false,
        });
        return { success: true, data: timesheets };
      } else {
        set({
          error: result.error,
          timesheetReviewLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        timesheetReviewLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  approveTimesheet: async (employeeId, timesheetId, status, note = null) => {
    set({ timesheetReviewLoading: true, error: null });
    try {
      const result = await approveTimesheetEntry(
        employeeId,
        timesheetId,
        status,
        note
      );

      if (result.success) {
        const normalized = ensureTimesheetId(
          normalizeTimesheetEntry(result.timesheet)
        );
        set((state) => ({
          employeeTimesheets: state.employeeTimesheets.map((entry) => {
            const entryId =
              entry.id || entry._id || entry.timesheetId || entry.uuid;
            return entryId === timesheetId ? normalized : entry;
          }),
          timesheetReviewLoading: false,
        }));
        return { success: true, timesheet: normalized };
      } else {
        set({
          error: result.error,
          timesheetReviewLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        timesheetReviewLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Avans yönetimi
  fetchMyAdvances: async (page = 1, limit = 10, status = null) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMyAdvances(page, limit, status);

      if (result.success) {
        set({
          myAdvances: result.data.advances || [],
          isLoading: false,
        });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  fetchMyAdvanceStatistics: async (year = null) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getMyAdvanceStatistics(year);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  createAdvance: async (advanceData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createAdvanceRequest(advanceData);

      if (result.success) {
        const currentAdvances = get().myAdvances;
        set({
          myAdvances: [result.advance, ...currentAdvances],
          isLoading: false,
        });
        return { success: true, advance: result.advance };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  getAdvanceById: async (advanceId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getAdvanceById(advanceId);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateAdvance: async (advanceId, advanceData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await updateAdvanceRequest(advanceId, advanceData);

      if (result.success) {
        const currentAdvances = get().myAdvances;
        const updatedAdvances = currentAdvances.map((advance) =>
          advance.id === advanceId ? result.data : advance
        );
        set({
          myAdvances: updatedAdvances,
          isLoading: false,
        });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteAdvance: async (advanceId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await deleteAdvanceRequest(advanceId);

      if (result.success) {
        const currentAdvances = get().myAdvances;
        const filteredAdvances = currentAdvances.filter(
          (advance) => advance.id !== advanceId
        );
        set({
          myAdvances: filteredAdvances,
          isLoading: false,
        });
        return { success: true, message: result.message };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Manager/Owner fonksiyonları
  fetchEmployeeLeaves: async (
    employeeId,
    page = 1,
    limit = 10,
    status = null,
    type = null,
    approved = null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getEmployeeLeaves(
        employeeId,
        page,
        limit,
        status,
        type,
        approved
      );

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  approveLeave: async (employeeId, leaveId, status, approvalNote = null) => {
    set({ isLoading: true, error: null });
    try {
      const result = await approveLeaveRequest(
        employeeId,
        leaveId,
        status,
        approvalNote
      );

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  fetchEmployeeAdvances: async (
    employeeId,
    page = 1,
    limit = 10,
    status = null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await getEmployeeAdvances(employeeId, page, limit, status);

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  approveAdvance: async (
    employeeId,
    advanceId,
    status,
    approvalNote = null
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await approveAdvanceRequest(
        employeeId,
        advanceId,
        status,
        approvalNote
      );

      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({
          error: result.error,
          isLoading: false,
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },
}));

export default usePersonelStore;
