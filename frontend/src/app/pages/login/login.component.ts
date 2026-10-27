import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-layout">
      <!-- Left Hero Column with Background Image & Branding -->
      <div class="login-hero d-none d-lg-flex flex-column justify-content-between p-5 text-white" style="background-image: linear-gradient(135deg, rgba(15, 23, 42, 0.72) 0%, rgba(30, 58, 138, 0.82) 100%), url('login-bg.jpg');">
        <!-- Top Logo & Brand -->
        <div class="d-flex align-items-center gap-3">
          <img src="hbl_logo.jpg" alt="HBL Logo" class="bg-white p-2 rounded-3 shadow-sm" style="max-height: 48px;" />
          <div>
            <h5 class="fw-bold mb-0 text-white tracking-wide">HBL ASSESSMENT PORTAL</h5>
          </div>
        </div>

        <!-- Center Lead Content -->
        <div class="my-auto py-5" style="max-width: 540px;">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1.5 rounded-pill fw-semibold mb-3 fs-7 bg-white bg-opacity-90">
            <i class="bi bi-shield-check me-1 text-primary"></i> Secure Assessment Environment
          </span>
          <h1 class="display-6 fw-bold text-white mb-3" style="line-height: 1.25;">
            Employee Assessment & Evaluation Platform
          </h1>
          <p class="lead text-white-50 fs-6 leading-relaxed mb-0">
            Secure, real-time departmental testing platform with automated question delivery, instant grading, and performance analytics.
          </p>
        </div>

        <!-- Bottom Security Tag -->
        <div class="pt-4 border-top border-white border-opacity-25 d-flex align-items-center gap-2 text-white-50 small fs-7">
          <i class="bi bi-shield-lock-fill text-warning fs-5"></i>
          <span>Authorized Personnel Access Only • Monitored Test Session</span>
        </div>
      </div>

      <!-- Right Column: Clean, Dedicated White Sign-In Panel -->
      <div class="login-panel bg-white d-flex flex-column justify-content-between p-4 p-sm-5">
        <!-- Mobile Logo Header (Visible on < lg screens) -->
        <div class="d-lg-none text-center mb-4 pt-2">
          <img src="hbl_logo.jpg" alt="HBL Logo" class="bg-white p-2 rounded-3 shadow-xs mb-2 border" style="max-height: 46px;" />
          <h5 class="fw-bold text-dark mb-0">HBL ASSESSMENT PORTAL</h5>
        </div>

        <div class="d-none d-lg-block"></div>

        <!-- Central Form Section -->
        <div class="my-auto w-100 py-3" style="max-width: 380px; margin: 0 auto;">
          <div class="mb-4">
            <h3 class="fw-bold text-dark mb-1">Sign In</h3>
            <p class="text-muted small mb-0">Enter your Employee ID and password to access the portal</p>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger border-0 rounded-3 py-2 px-3 small d-flex align-items-center gap-2 mb-3 fs-7">
            <i class="bi bi-exclamation-octagon-fill text-danger fs-6"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <form (ngSubmit)="onLogin()">
            <div class="mb-3">
              <label class="form-label fw-semibold text-secondary small mb-1.5">Employee ID (Username)</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 text-muted px-3"><i class="bi bi-person-vcard fs-5"></i></span>
                <input
                  type="text"
                  class="form-control text-uppercase border-start-0 ps-1 fw-semibold py-2.5"
                  placeholder="Enter Employee ID"
                  [(ngModel)]="employeeId"
                  name="employeeId"
                  required
                />
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label fw-semibold text-secondary small mb-1.5">Password</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0 text-muted px-3"><i class="bi bi-lock fs-5"></i></span>
                <input
                  type="password"
                  class="form-control border-start-0 ps-1 py-2.5"
                  placeholder="Enter Password"
                  [(ngModel)]="password"
                  name="password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-100 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3 fs-6 sign-in-btn mt-2"
              [disabled]="isLoading"
            >
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm"></span>
              <span>{{ isLoading ? 'Authenticating...' : 'Sign In to Portal' }}</span>
              <i *ngIf="!isLoading" class="bi bi-arrow-right fs-5"></i>
            </button>
          </form>
        </div>

        <!-- Bottom Copyright -->
        <div class="text-center text-muted small pt-3 border-top fs-7">
          <span>© HBL Power Systems Ltd. • Assessment Portal</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-layout {
      min-height: 100vh;
      display: flex;
      width: 100%;
      overflow: hidden;
    }
    .login-hero {
      flex: 1;
      background-color: #1e3a8a;
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      position: relative;
    }
    .login-panel {
      width: 100%;
      max-width: 480px;
      min-height: 100vh;
      box-shadow: -15px 0 45px rgba(0, 0, 0, 0.25);
      z-index: 2;
    }
    @media (max-width: 991px) {
      .login-panel {
        max-width: 100%;
        min-height: 100vh;
      }
    }
    .sign-in-btn {
      min-height: 52px;
      font-size: 1.05rem;
      letter-spacing: 0.3px;
    }
    .tracking-wide {
      letter-spacing: 0.5px;
    }
    .fs-7 {
      font-size: 0.825rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  employeeId = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const empParam = params['empId'] || params['employeeId'];
      if (empParam) {
        this.employeeId = empParam.trim().toUpperCase();
        this.cdr.detectChanges();
      }
    });
  }

  onLogin(): void {
    if (!this.employeeId || !this.password) {
      this.errorMessage = 'Please enter Employee ID and Password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login({ employeeId: this.employeeId.trim(), password: this.password.trim() }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        if (res.employee.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid Employee ID or Password.';
        this.cdr.detectChanges();
      },
    });
  }
}
