import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, Employee } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm" *ngIf="!isLoginPage">
      <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center fw-bold gap-2" [routerLink]="isExamActive ? null : '/'" [class.pe-none]="isExamActive">
          <img src="hbl_logo.jpg" alt="HBL Logo" class="bg-white p-1 rounded shadow-xs" style="height: 38px;" />
          <span class="tracking-wide">HBL ASSESSMENT PORTAL</span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" *ngIf="!isExamActive">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarContent">
          <!-- Active Exam Lock Badge -->
          <div class="me-auto" *ngIf="isExamActive">
            <span class="badge bg-warning text-dark px-3 py-2 fw-bold fs-6">
              <i class="bi bi-shield-lock-fill me-1"></i> ASSESSMENT IN PROGRESS — NAVIGATION RESTRICTED
            </span>
          </div>

          <!-- Standard Navigation Links when not in Exam -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0" *ngIf="currentEmployee && !isExamActive">
            <li class="nav-item" *ngIf="currentEmployee.role === 'EMPLOYEE'">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                <i class="bi bi-house-door me-1"></i> Dashboard
              </a>
            </li>
            <li class="nav-item" *ngIf="currentEmployee.role === 'EMPLOYEE'">
              <a class="nav-link" routerLink="/my-attempts" routerLinkActive="active">
                <i class="bi bi-journal-check me-1"></i> My Score History
              </a>
            </li>
            <li class="nav-item" *ngIf="currentEmployee.role === 'ADMIN'">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active">
                <i class="bi bi-speedometer2 me-1"></i> Admin Panel
              </a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-3 ms-auto" *ngIf="currentEmployee && !isExamActive">
            <div class="text-end text-light">
              <div class="fw-semibold text-white">{{ currentEmployee.name }}</div>
              <small class="text-muted small">
                {{ currentEmployee.employeeId }} |
                <span class="badge bg-primary ms-1">{{ currentEmployee.department }}</span>
                <span class="badge bg-info text-dark ms-1">{{ currentEmployee.level }}</span>
              </small>
            </div>
            <button class="btn btn-outline-light btn-sm ms-2" (click)="logout()">
              <i class="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link.active {
      color: #38bdf8 !important;
      font-weight: 600;
    }
  `]
})
export class NavbarComponent implements OnInit {
  currentEmployee: Employee | null = null;
  isExamActive = false;
  isLoginPage = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentEmployee = this.authService.getStoredEmployee();

    this.authService.currentEmployee$.subscribe(emp => {
      this.currentEmployee = emp || this.authService.getStoredEmployee();
      this.cdr.detectChanges();
    });

    // Track active route to enforce window/navigation restrictions ONLY during active exam route
    this.checkExamStatus(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkExamStatus(event.urlAfterRedirects || event.url);
        this.cdr.detectChanges();
      });
  }

  private checkExamStatus(url: string): void {
    const cleanUrl = url.split('?')[0];
    this.isLoginPage = cleanUrl.startsWith('/login') || cleanUrl === '/';
    const emp = this.authService.getStoredEmployee();
    const hasActiveTimer = emp && localStorage.getItem(`exam_end_time_${emp.employeeId}`);
    // Exam mode is active ONLY when user is strictly on /exam route AND an active timer exists
    this.isExamActive = cleanUrl.startsWith('/exam') && !!hasActiveTimer;
  }

  logout(): void {
    if (this.isExamActive) {
      alert('Cannot log out during an active exam attempt.');
      return;
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
