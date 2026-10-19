import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Active Exam Lockdown: Prevent opening other pages (Dashboard, History) in new tabs/windows during active exam
  const emp = authService.getStoredEmployee();
  if (emp) {
    const storageKey = `exam_end_time_${emp.employeeId}`;
    const savedEndTime = localStorage.getItem(storageKey);
    if (savedEndTime) {
      const remaining = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000);
      if (remaining > 0 && !state.url.includes('/exam') && !state.url.includes('/result')) {
        // Force lock candidate back into active exam page
        router.navigate(['/exam']);
        return false;
      }
    }
  }

  return true;
};
