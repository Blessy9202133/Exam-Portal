import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid py-4 px-4" *ngIf="!apiError">
      <!-- Admin Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h4 class="fw-bold text-dark mb-1"><i class="bi bi-speedometer2 me-2 text-primary"></i> Admin Control Center</h4>
          <p class="text-muted small mb-0">Manage department templates, employee registration, and assessment results.</p>
        </div>
        <button class="btn btn-outline-secondary btn-sm rounded-3 shadow-xs" (click)="refreshDashboardData()">
          <i class="bi bi-arrow-clockwise me-1"></i> Refresh Data
        </button>
      </div>

      <!-- Sleek KPI Metrics Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-xs rounded-4 p-3 bg-primary text-white">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-white-50 text-uppercase fw-bold fs-7">Registered Employees</small>
                <h3 class="fw-bold mt-1 mb-0 font-monospace">
                  <span *ngIf="isDataLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ stats?.totalEmployees || 0 }}
                </h3>
              </div>
              <div class="fs-1 opacity-50"><i class="bi bi-people-fill"></i></div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-xs rounded-4 p-3 bg-dark text-white">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-white-50 text-uppercase fw-bold fs-7">Question Bank Size</small>
                <h3 class="fw-bold text-warning mt-1 mb-0 font-monospace">
                  <span *ngIf="isDataLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ stats?.totalQuestions || 0 }} <span class="fs-6 text-white-50 fw-normal">Questions</span>
                </h3>
              </div>
              <div class="fs-1 opacity-50"><i class="bi bi-file-earmark-text-fill"></i></div>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card border-0 shadow-xs rounded-4 p-3 bg-success text-white">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <small class="text-white-50 text-uppercase fw-bold fs-7">Exams Completed</small>
                <h3 class="fw-bold mt-1 mb-0 font-monospace">
                  <span *ngIf="isDataLoading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ stats?.totalAttempts || 0 }}
                </h3>
              </div>
              <div class="fs-1 opacity-50"><i class="bi bi-file-earmark-check-fill"></i></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clean Tab Bar Navigation -->
      <ul class="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-xs border gap-1">
        <li class="nav-item">
          <button class="nav-link fw-semibold px-3 py-2" [class.active]="activeTab === 'template-upload'" (click)="activeTab = 'template-upload'">
            <i class="bi bi-file-earmark-arrow-up-fill me-1"></i> Department Question Files
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link fw-semibold px-3 py-2" [class.active]="activeTab === 'user-management'" (click)="activeTab = 'user-management'">
            <i class="bi bi-people-fill me-1"></i> User Profiles & Registration
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link fw-semibold px-3 py-2" [class.active]="activeTab === 'exam-access'" (click)="activeTab = 'exam-access'">
            <i class="bi bi-link-45deg me-1 fs-5"></i> Exam Link & Attempt Control
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link fw-semibold px-3 py-2" [class.active]="activeTab === 'attempts'" (click)="activeTab = 'attempts'">
            <i class="bi bi-journal-check me-1"></i> Exam Results Roster
          </button>
        </li>
      </ul>

      <!-- TAB 1: Department Question Management -->
      <div *ngIf="activeTab === 'template-upload'">
        <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div>
            <h6 class="fw-bold text-dark mb-0"><i class="bi bi-building me-2 text-primary"></i> Department Question Management</h6>
            <small class="text-muted">Showing {{ filteredDeptStats.length }} of {{ stats?.deptStats?.length || 0 }} Excel & Database Departments</small>
          </div>

          <!-- Search & Filter Controls -->
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="input-group input-group-sm" style="width: 260px;">
              <span class="input-group-text bg-white text-muted"><i class="bi bi-search"></i></span>
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search departments..." 
                [(ngModel)]="deptSearchTerm" 
              />
              <button *ngIf="deptSearchTerm" class="btn btn-outline-secondary" (click)="deptSearchTerm = ''">
                <i class="bi bi-x"></i>
              </button>
            </div>

            <div class="btn-group btn-group-sm" role="group">
              <button 
                class="btn" 
                [ngClass]="deptFilterMode === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'"
                (click)="deptFilterMode = 'ALL'"
              >
                All ({{ stats?.deptStats?.length || 0 }})
              </button>
              <button 
                class="btn" 
                [ngClass]="deptFilterMode === 'ACTIVE' ? 'btn-success' : 'btn-outline-secondary'"
                (click)="deptFilterMode = 'ACTIVE'"
              >
                Active
              </button>
              <button 
                class="btn" 
                [ngClass]="deptFilterMode === 'EMPTY' ? 'btn-secondary' : 'btn-outline-secondary'"
                (click)="deptFilterMode = 'EMPTY'"
              >
                Empty
              </button>
            </div>
          </div>
        </div>

        <div class="row g-3.5 justify-content-start mb-4" *ngIf="stats?.deptStats">
          <div class="col-md-6 col-lg-4" *ngFor="let d of filteredDeptStats">
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-white text-center h-100 border-top border-4 border-primary">
              <!-- Centered Department Name & Status Badge -->
              <div class="d-flex flex-column align-items-center mb-2">
                <div class="d-flex align-items-center gap-2 mb-1 justify-content-center flex-wrap">
                  <h6 class="fw-bold text-dark mb-0">{{ d.department }}</h6>
                  <span class="badge px-2 py-0.5 fs-7" [ngClass]="d.questionCount > 0 ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'">
                    {{ d.questionCount > 0 ? 'Active' : 'Empty' }}
                  </span>
                </div>
                <small class="text-muted small">
                  <i class="bi bi-people me-1"></i>{{ d.employeeCount || 0 }} Employees
                </small>
              </div>

              <!-- Centered Question Count -->
              <div class="py-1 px-3 bg-light rounded-3 d-inline-block mx-auto mb-3">
                <span class="fs-4 fw-bold text-primary">{{ d.questionCount }}</span>
                <small class="fs-6 text-muted ms-1 fw-normal">Active Questions</small>
              </div>

              <!-- Centered Action Buttons -->
              <div class="d-flex flex-column gap-2 mt-auto">
                <!-- Download Existing Active Database Question Data -->
                <button 
                  class="btn btn-success btn-sm fw-bold w-100 shadow-xs d-flex align-items-center justify-content-center gap-1" 
                  (click)="exportActiveQuestions(d.department)"
                  [disabled]="d.questionCount === 0"
                >
                  <i class="bi bi-download"></i> Export Active Questions (.xlsx)
                </button>

                <!-- Blank Excel & Word Template Download -->
                <div class="btn-group btn-group-sm w-100">
                  <button class="btn btn-outline-secondary fw-semibold d-flex align-items-center justify-content-center gap-1" (click)="downloadExcelTemplate(d.department)">
                    <i class="bi bi-file-earmark-excel text-success"></i> Excel
                  </button>
                  <button class="btn btn-outline-secondary fw-semibold d-flex align-items-center justify-content-center gap-1" (click)="downloadWordTemplate(d.department)">
                    <i class="bi bi-file-earmark-word text-primary"></i> Word
                  </button>
                </div>

                <!-- Upload Fresh Question File -->
                <button class="btn btn-primary btn-sm fw-bold w-100 d-flex align-items-center justify-content-center gap-1 shadow-xs" (click)="openUploadModal(d.department)">
                  <i class="bi bi-cloud-arrow-up-fill"></i> Upload File
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="filteredDeptStats.length === 0" class="col-12 text-center py-5 text-muted">
            <i class="bi bi-search fs-1 d-block mb-2"></i>
            <p class="mb-0 fw-semibold">No departments match your search "{{ deptSearchTerm }}".</p>
          </div>
        </div>
      </div>

      <!-- TAB 2: User Profiles & Registration (Full Width & Clean) -->
      <div *ngIf="activeTab === 'user-management'">
        <!-- Top Action & Info Header Card -->
        <div class="card border-0 shadow-xs rounded-4 mb-4 bg-white border-start border-4 border-primary">
          <div class="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <h5 class="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-people-fill text-primary"></i> Active User Directory
                </h5>
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fw-bold fs-7">
                  {{ employees.length }} Total Accounts
                </span>
              </div>
              <p class="text-muted small mb-0">
                Manage employee profiles, edit contact information, department levels, and add or import user accounts.
              </p>
            </div>

            <!-- Header Quick Action Buttons -->
            <div class="d-flex flex-wrap align-items-center gap-2">
              <button
                class="btn btn-primary btn-sm fw-bold px-3 py-2 shadow-xs d-flex align-items-center gap-1.5 rounded-3"
                (click)="openRegisterUserModal()"
              >
                <i class="bi bi-person-plus-fill"></i>
                <span>Register New User</span>
              </button>

              <button
                class="btn btn-success btn-sm fw-bold px-3 py-2 shadow-xs d-flex align-items-center gap-1.5 rounded-3"
                (click)="openEmpUploadModal()"
              >
                <i class="bi bi-file-earmark-spreadsheet-fill"></i>
                <span>Bulk Upload Excel</span>
              </button>

              <button
                class="btn btn-outline-secondary btn-sm fw-semibold px-3 py-2 shadow-xs d-flex align-items-center gap-1.5 rounded-3"
                (click)="downloadEmployeeTemplate()"
                title="Download Excel Template"
              >
                <i class="bi bi-download"></i>
                <span>Template</span>
              </button>

              <button
                class="btn btn-outline-secondary btn-sm px-2.5 py-2 shadow-xs rounded-3"
                (click)="refreshDashboardData()"
                title="Reload"
              >
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Directory Table Card with Advanced Search & Filters -->
        <div class="card border-0 shadow-xs rounded-4">
          <!-- Filters Toolbar -->
          <div class="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div class="d-flex flex-wrap align-items-center gap-2.5">
              <!-- Search box -->
              <div class="input-group input-group-sm" style="width: 280px;">
                <span class="input-group-text bg-light text-muted border-end-0"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control border-start-0 ps-0"
                  placeholder="Search by ID, name, email, designation..."
                  [(ngModel)]="userSearchTerm"
                  (input)="userCurrentPage = 1"
                />
                <button *ngIf="userSearchTerm" class="btn btn-outline-secondary border-start-0" (click)="userSearchTerm = ''; userCurrentPage = 1">
                  <i class="bi bi-x"></i>
                </button>
              </div>

              <!-- Department Filter -->
              <select class="form-select form-select-sm" [(ngModel)]="userDeptFilter" (change)="userCurrentPage = 1" style="width: 190px;">
                <option value="">All Departments</option>
                <option *ngFor="let d of stats?.deptStats" [value]="d.department">{{ d.department }}</option>
              </select>

              <!-- Level Filter -->
              <select class="form-select form-select-sm" [(ngModel)]="userLevelFilter" (change)="userCurrentPage = 1" style="width: 130px;">
                <option value="">All Levels</option>
                <option value="L1">Level L1</option>
                <option value="L2">Level L2</option>
                <option value="L3">Level L3</option>
              </select>

              <!-- Role Filter -->
              <select class="form-select form-select-sm" [(ngModel)]="userRoleFilter" (change)="userCurrentPage = 1" style="width: 140px;">
                <option value="">All Roles</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <!-- Showing Info & Page Size -->
            <div class="d-flex align-items-center gap-2 small text-muted">
              <span>Showing <strong>{{ paginatedEmployees.length }}</strong> of <strong>{{ filteredEmployees.length }}</strong> users</span>
              <select class="form-select form-select-sm py-1 px-2" style="width: 100px;" [(ngModel)]="userPageSize" (change)="userCurrentPage = 1">
                <option [ngValue]="25">25 / page</option>
                <option [ngValue]="50">50 / page</option>
                <option [ngValue]="100">100 / page</option>
                <option [ngValue]="10000">Show All</option>
              </select>
            </div>
          </div>

          <!-- Full Width Table -->
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light text-secondary small text-uppercase">
                  <tr>
                    <th class="ps-4 py-3" style="width: 130px;">Employee ID</th>
                    <th class="py-3">Name & Designation</th>
                    <th class="py-3">Contact (Email / Mobile)</th>
                    <th class="py-3">Department</th>
                    <th class="py-3">Level</th>
                    <th class="py-3">Role</th>
                    <th class="pe-4 py-3 text-end" style="min-width: 160px;">Actions</th>
                  </tr>
                </thead>
                <tbody class="small">
                  <tr *ngFor="let emp of paginatedEmployees">
                    <td class="ps-4">
                      <span class="badge bg-light text-dark border font-monospace px-2.5 py-1.5 fs-7">{{ emp.employeeId }}</span>
                    </td>
                    <td>
                      <div class="fw-bold text-dark fs-6">{{ emp.name }}</div>
                      <small class="text-muted" *ngIf="emp.designation">{{ emp.designation }}</small>
                    </td>
                    <td>
                      <div class="text-secondary d-flex align-items-center gap-1.5">
                        <i class="bi bi-envelope text-muted"></i>
                        <span>{{ emp.email }}</span>
                      </div>
                      <small class="text-muted d-flex align-items-center gap-1.5 mt-0.5" *ngIf="emp.mobilePhone">
                        <i class="bi bi-telephone text-muted"></i>
                        <span>{{ emp.mobilePhone }}</span>
                      </small>
                    </td>
                    <td>
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 fw-semibold">
                        {{ emp.department }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2.5 py-1.5 fw-bold">
                        {{ emp.level }}
                      </span>
                    </td>
                    <td>
                      <span class="badge px-2.5 py-1.5 fw-bold" [ngClass]="emp.role === 'ADMIN' ? 'bg-danger text-white' : 'bg-secondary-subtle text-secondary'">
                        {{ emp.role }}
                      </span>
                    </td>
                    <td class="pe-4 text-end">
                      <div class="d-inline-flex gap-1.5">
                        <!-- Edit Profile Button -->
                        <button
                          class="btn btn-outline-primary btn-sm px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                          (click)="openEditUserModal(emp)"
                          title="Edit User Profile"
                        >
                          <i class="bi bi-pencil-square"></i>
                          <span>Edit</span>
                        </button>

                        <!-- Delete Button -->
                        <button
                          class="btn btn-outline-danger btn-sm px-2 py-1 shadow-xs"
                          *ngIf="emp.employeeId !== '123456'"
                          (click)="onDeleteUser(emp)"
                          title="Delete Account"
                        >
                          <i class="bi bi-trash-fill"></i>
                        </button>

                        <span *ngIf="emp.employeeId === '123456'" class="badge bg-dark align-self-center px-2 py-1.5">
                          Super Admin
                        </span>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="filteredEmployees.length === 0">
                    <td colspan="7" class="text-center py-5 text-muted">
                      <i class="bi bi-people display-4 d-block mb-2 text-secondary opacity-50"></i>
                      <h6 class="fw-bold text-dark">No User Accounts Found</h6>
                      <p class="small mb-0">No users matched your search filters. Try clearing your filters or register a new user.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Clean Pagination Bar Footer -->
          <div class="card-footer bg-white py-3 px-4 border-top d-flex flex-wrap align-items-center justify-content-between gap-2" *ngIf="filteredEmployees.length > userPageSize">
            <small class="text-muted fw-semibold">
              Page <strong>{{ userCurrentPage }}</strong> of <strong>{{ userTotalPages }}</strong> ({{ filteredEmployees.length }} total employees)
            </small>

            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-outline-secondary px-3"
                [disabled]="userCurrentPage === 1"
                (click)="userCurrentPage = userCurrentPage - 1"
              >
                <i class="bi bi-chevron-left me-1"></i> Previous
              </button>
              <button
                class="btn btn-outline-secondary px-3"
                [disabled]="userCurrentPage >= userTotalPages"
                (click)="userCurrentPage = userCurrentPage + 1"
              >
                Next <i class="bi bi-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Exam Link & Attempt Access Control -->
      <div *ngIf="activeTab === 'exam-access'">
        <!-- Informational Alert & Action Banners -->
        <div *ngIf="examAccessSuccessMsg" class="alert alert-success py-2.5 px-3 rounded-3 shadow-xs mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill text-success fs-5"></i>
            <span>{{ examAccessSuccessMsg }}</span>
          </div>
          <button type="button" class="btn-close btn-sm" (click)="examAccessSuccessMsg = ''"></button>
        </div>

        <div *ngIf="examAccessErrMsg" class="alert alert-danger py-2.5 px-3 rounded-3 shadow-xs mb-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
            <span>{{ examAccessErrMsg }}</span>
          </div>
          <button type="button" class="btn-close btn-sm" (click)="examAccessErrMsg = ''"></button>
        </div>

        <!-- Metric KPI Cards for Exam Access -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-secondary">
              <small class="text-muted fw-semibold text-uppercase small mb-1">Eligible Employees</small>
              <div class="fs-3 fw-bold text-dark font-monospace">{{ examAccessList.length }}</div>
              <small class="text-muted fs-7">total employee accounts</small>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-success">
              <small class="text-muted fw-semibold text-uppercase small mb-1">Active Exam Links</small>
              <div class="fs-3 fw-bold text-success font-monospace">{{ countExamStatus('LINK_ACTIVE') }}</div>
              <small class="text-muted fs-7">ready to attempt (1 attempt)</small>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-primary">
              <small class="text-muted fw-semibold text-uppercase small mb-1">In-Progress</small>
              <div class="fs-3 fw-bold text-primary font-monospace">{{ countExamStatus('IN_PROGRESS') }}</div>
              <small class="text-muted fs-7">exam currently open</small>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="card border-0 shadow-xs rounded-4 p-3 bg-white text-center h-100 border-start border-4 border-danger">
              <small class="text-muted fw-semibold text-uppercase small mb-1">Attempt Used / Locked</small>
              <div class="fs-3 fw-bold text-danger font-monospace">{{ countExamStatus('LOCKED') }}</div>
              <small class="text-muted fs-7">need re-attempt permission</small>
            </div>
          </div>
        </div>

        <!-- Main Access Control Table Card -->
        <div class="card border-0 shadow-xs rounded-4">
          <div class="card-header bg-white py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h6 class="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                <i class="bi bi-shield-check text-primary fs-5"></i>
                Exam Link Distribution & Single-Attempt Access Policy
              </h6>
              <small class="text-muted">
                Select users below and click <strong>"Send / Enable Exam Link"</strong> to grant 1 attempt. If an employee faces an issue or fails to attempt, click <strong>"Grant Re-attempt (+1)"</strong>.
              </small>
            </div>

            <!-- Bulk Multi-Select Actions -->
            <div class="d-flex flex-wrap align-items-center gap-2">
              <button
                class="btn btn-success btn-sm fw-bold shadow-xs d-flex align-items-center gap-1"
                [disabled]="selectedEmpIds.size === 0 || isExamAccessAction"
                (click)="enableSelectedExamLinks()"
              >
                <i class="bi bi-send-check-fill"></i>
                <span>Send / Enable Link ({{ selectedEmpIds.size }})</span>
              </button>

              <button
                class="btn btn-warning btn-sm fw-bold text-dark shadow-xs d-flex align-items-center gap-1"
                [disabled]="selectedEmpIds.size === 0 || isExamAccessAction"
                (click)="grantReattemptForSelected()"
              >
                <i class="bi bi-arrow-repeat"></i>
                <span>Grant Re-attempt (+1) ({{ selectedEmpIds.size }})</span>
              </button>

              <button
                class="btn btn-outline-danger btn-sm fw-semibold d-flex align-items-center gap-1"
                [disabled]="selectedEmpIds.size === 0 || isExamAccessAction"
                (click)="revokeSelectedExamLinks()"
              >
                <i class="bi bi-slash-circle"></i>
                <span>Revoke</span>
              </button>

              <button class="btn btn-outline-secondary btn-sm" (click)="loadExamAccessList()" title="Reload Roster">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <!-- Filters Row -->
          <div class="p-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="input-group input-group-sm" style="width: 240px;">
                <span class="input-group-text bg-white text-muted"><i class="bi bi-search"></i></span>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Search user ID or name..."
                  [(ngModel)]="examAccessSearchTerm"
                />
                <button *ngIf="examAccessSearchTerm" class="btn btn-outline-secondary" (click)="examAccessSearchTerm = ''">
                  <i class="bi bi-x"></i>
                </button>
              </div>

              <select class="form-select form-select-sm" [(ngModel)]="examAccessDeptFilter" style="width: 180px;">
                <option value="">All Departments</option>
                <option *ngFor="let d of stats?.deptStats" [value]="d.department">{{ d.department }}</option>
              </select>

              <select class="form-select form-select-sm" [(ngModel)]="examAccessStatusFilter" style="width: 170px;">
                <option value="ALL">All Statuses</option>
                <option value="LINK_ACTIVE">Link Active (1 Attempt)</option>
                <option value="NOT_ASSIGNED">Not Sent / Inactive</option>
                <option value="IN_PROGRESS">In-Progress</option>
                <option value="LOCKED">Attempt Used / Locked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div class="small text-muted fw-semibold">
              Showing {{ filteredExamAccessList.length }} of {{ examAccessList.length }} users &nbsp;|&nbsp;
              <span class="text-primary">{{ selectedEmpIds.size }} selected</span>
            </div>
          </div>

          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 small">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-3" style="width: 40px;">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        [checked]="isAllExamSelected()"
                        (change)="toggleSelectAllExam($event)"
                      />
                    </th>
                    <th>Employee ID</th>
                    <th>Name & Designation</th>
                    <th>Department & Level</th>
                    <th>Link Status</th>
                    <th>Attempts (Used / Max)</th>
                    <th>Direct Exam Link</th>
                    <th class="pe-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let emp of filteredExamAccessList">
                    <td class="ps-3">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        [checked]="selectedEmpIds.has(emp.employeeId)"
                        (change)="toggleSelectEmp(emp.employeeId)"
                      />
                    </td>
                    <td><code>{{ emp.employeeId }}</code></td>
                    <td>
                      <div class="fw-bold">{{ emp.name }}</div>
                      <small class="text-muted fs-7">{{ emp.designation || emp.email }}</small>
                    </td>
                    <td>
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ emp.department }}</span>
                      <span class="badge bg-info-subtle text-info-emphasis border border-info-subtle ms-1">{{ emp.level }}</span>
                    </td>
                    <td>
                      <span *ngIf="emp.examAccess?.computedStatus === 'LINK_ACTIVE'" class="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fw-bold">
                        <i class="bi bi-check-circle-fill me-1"></i> LINK ACTIVE
                      </span>
                      <span *ngIf="emp.examAccess?.computedStatus === 'IN_PROGRESS'" class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fw-bold">
                        <i class="bi bi-play-circle-fill me-1"></i> IN PROGRESS
                      </span>
                      <span *ngIf="emp.examAccess?.computedStatus === 'LOCKED'" class="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 fw-bold">
                        <i class="bi bi-lock-fill me-1"></i> ATTEMPT USED
                      </span>
                      <span *ngIf="emp.examAccess?.computedStatus === 'COMPLETED'" class="badge bg-dark text-white px-2.5 py-1 fw-bold">
                        <i class="bi bi-check2-all me-1"></i> COMPLETED
                      </span>
                      <span *ngIf="emp.examAccess?.computedStatus === 'NOT_ASSIGNED'" class="badge bg-secondary-subtle text-secondary px-2.5 py-1 fw-bold">
                        <i class="bi bi-dash-circle me-1"></i> NOT SENT
                      </span>
                    </td>
                    <td>
                      <span class="font-monospace fw-bold fs-7" [ngClass]="emp.examAccess?.attemptsUsed >= emp.examAccess?.attemptsAllowed && emp.examAccess?.attemptsAllowed > 0 ? 'text-danger' : 'text-dark'">
                        {{ emp.examAccess?.attemptsUsed || 0 }} / {{ emp.examAccess?.attemptsAllowed || 0 }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm py-1 px-2 font-monospace fs-7 d-flex align-items-center gap-1 shadow-xs"
                        (click)="copyDirectExamLink(emp)"
                        title="Copy direct exam login link"
                      >
                        <i class="bi" [ngClass]="copiedEmpId === emp.employeeId ? 'bi-check-lg text-success' : 'bi-link-45deg'"></i>
                        <span>{{ copiedEmpId === emp.employeeId ? 'Copied Link!' : 'Copy Link' }}</span>
                      </button>
                    </td>
                    <td class="pe-3 text-end">
                      <div class="d-inline-flex gap-1">
                        <!-- Send / Enable Link button (when link inactive) -->
                        <button
                          class="btn btn-success btn-sm px-2.5 py-1 fw-bold shadow-xs"
                          *ngIf="!emp.examAccess?.isLinkActive"
                          (click)="enableExamLinkSingle(emp)"
                          title="Enable exam link for 1 attempt"
                        >
                          <i class="bi bi-send-fill me-1"></i> Send Link
                        </button>

                        <!-- Grant Re-attempt (+1) button (when attempt used or locked) -->
                        <button
                          class="btn btn-warning btn-sm text-dark px-2.5 py-1 fw-bold shadow-xs"
                          (click)="grantReattemptSingle(emp)"
                          title="Grant permission for 1 more attempt"
                        >
                          <i class="bi bi-arrow-repeat me-1"></i> Grant Re-attempt (+1)
                        </button>

                        <!-- Revoke button (when link active) -->
                        <button
                          class="btn btn-outline-danger btn-sm px-2 py-1"
                          *ngIf="emp.examAccess?.isLinkActive"
                          (click)="revokeExamLinkSingle(emp)"
                          title="Revoke / Lock Exam Access"
                        >
                          <i class="bi bi-x-circle"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="filteredExamAccessList.length === 0">
                    <td colspan="8" class="text-center py-5 text-muted">
                      <i class="bi bi-search fs-2 d-block mb-2"></i>
                      No employees match the selected criteria.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Exam Results Roster -->
      <div *ngIf="activeTab === 'attempts'" class="card border-0 shadow-xs rounded-4">
        <div class="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 class="fw-bold mb-0 text-dark">Employee Exam Attempt Results Roster ({{ allAttempts.length }})</h6>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 small">
              <thead class="bg-light">
                <tr>
                  <th class="ps-3">Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th class="pe-3 text-end">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let attempt of allAttempts">
                  <td class="ps-3 fw-bold">{{ attempt.employeeName }}</td>
                  <td><code>{{ attempt.employeeId }}</code></td>
                  <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ attempt.department }}</span></td>
                  <td><span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">{{ attempt.level }}</span></td>
                  <td class="fw-bold">{{ attempt.score }} / {{ attempt.totalQuestions }}</td>
                  <td>{{ attempt.percentage }}%</td>
                  <td>
                    <span class="badge px-2.5 py-1" [ngClass]="attempt.status === 'PASSED' ? 'bg-success' : 'bg-danger'">
                      {{ attempt.status }}
                    </span>
                  </td>
                  <td class="pe-3 text-end text-muted small">{{ attempt.completedAt | date: 'short' }}</td>
                </tr>
                <tr *ngIf="allAttempts.length === 0 && !isDataLoading">
                  <td colspan="8" class="text-center py-4 text-muted">No exam submissions recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Question File Modal -->
    <div class="modal fade show d-block bg-dark bg-opacity-50" tabIndex="-1" *ngIf="showUploadModal" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-primary text-white py-3 px-4 rounded-top-4">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <i class="bi bi-cloud-arrow-up-fill fs-5"></i>
              Upload Questions for {{ selectedDepartment }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showUploadModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div *ngIf="uploadSuccessMsg" class="alert alert-success py-2 px-3 small alert-dismissible fade show">
              <i class="bi bi-check-circle-fill me-1"></i>{{ uploadSuccessMsg }}
            </div>

            <div *ngIf="uploadErrMsg" class="alert alert-danger py-2 px-3 small alert-dismissible fade show">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ uploadErrMsg }}
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small">Upload Mode</label>
              <select class="form-select form-select-sm" [(ngModel)]="uploadMode">
                <option value="REPLACE">REPLACE (Overwrite existing questions for {{ selectedDepartment }})</option>
                <option value="APPEND">APPEND (Add new questions to existing bank)</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small">Select File (.xlsx or .docx)</label>
              <input type="file" class="form-control form-control-sm" (change)="onFileSelected($event)" accept=".xlsx, .xls, .docx" />
            </div>

            <div class="p-3 border border-2 border-dashed rounded-3 bg-light text-center small mb-3">
              <i class="bi bi-file-earmark-code fs-3 text-primary d-block mb-1"></i>
              <strong>{{ selectedFile ? selectedFile.name : 'No file chosen yet' }}</strong>
            </div>

            <button
              class="btn btn-primary w-100 fw-bold py-2 shadow-xs d-flex align-items-center justify-content-center gap-1"
              [disabled]="!selectedFile || isUploading"
              (click)="uploadTemplateFile()"
            >
              <span *ngIf="isUploading" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!isUploading" class="bi bi-check2-circle me-1"></i>
              <span>{{ isUploading ? 'Importing Questions...' : 'Import Question File' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Upload Employee Accounts Modal -->
    <div class="modal fade show d-block bg-dark bg-opacity-50" tabIndex="-1" *ngIf="showEmpUploadModal" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-success text-white py-3 px-4 rounded-top-4">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <i class="bi bi-people-fill fs-5"></i>
              Bulk Import Employee User Accounts
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showEmpUploadModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div *ngIf="empUploadSuccessMsg" class="alert alert-success py-2 px-3 small alert-dismissible fade show">
              <i class="bi bi-check-circle-fill me-1"></i>{{ empUploadSuccessMsg }}
            </div>

            <div *ngIf="empUploadErrMsg" class="alert alert-danger py-2 px-3 small alert-dismissible fade show">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ empUploadErrMsg }}
            </div>

            <div class="p-3 bg-light rounded-3 mb-3 border">
              <small class="fw-bold text-dark d-block mb-1">Supported Excel Format:</small>
              <code class="d-block small text-muted"># | Employee Number | Display Name | Department | Designation | Level | Mobile Phone | Work Email</code>
            </div>

            <div class="mb-3">
              <label class="form-label fw-semibold small">Select Employee Excel File (.xlsx)</label>
              <input type="file" class="form-control form-control-sm" (change)="onEmpFileSelected($event)" accept=".xlsx, .xls" />
            </div>

            <div class="p-3 border border-2 border-dashed rounded-3 bg-light text-center small mb-3">
              <i class="bi bi-file-earmark-spreadsheet fs-3 text-success d-block mb-1"></i>
              <strong>{{ selectedEmpFile ? selectedEmpFile.name : 'No file chosen yet' }}</strong>
            </div>

            <button
              class="btn btn-success w-100 fw-bold py-2 shadow-xs d-flex align-items-center justify-content-center gap-1"
              [disabled]="!selectedEmpFile || isEmpUploading"
              (click)="uploadEmployeeExcel()"
            >
              <span *ngIf="isEmpUploading" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!isEmpUploading" class="bi bi-check2-circle me-1"></i>
              <span>{{ isEmpUploading ? 'Importing Employee Accounts...' : 'Import Employee Accounts' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Employee Profile Modal -->
    <div class="modal fade show d-block bg-dark bg-opacity-50" tabIndex="-1" *ngIf="showEditUserModal" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-primary text-white py-3 px-4 rounded-top-4">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <i class="bi bi-person-gear fs-5"></i>
              Edit Employee Profile: {{ editingEmployee?.name }} ({{ editingEmployee?.employeeId }})
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showEditUserModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div *ngIf="editUserSuccess" class="alert alert-success py-2.5 px-3 small alert-dismissible fade show rounded-3 mb-3">
              <i class="bi bi-check-circle-fill me-1"></i>{{ editUserSuccess }}
            </div>

            <div *ngIf="editUserErr" class="alert alert-danger py-2.5 px-3 small alert-dismissible fade show rounded-3 mb-3">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ editUserErr }}
            </div>

            <form (ngSubmit)="onSaveEditUser()" *ngIf="editingEmployee" autocomplete="off">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-muted">Employee ID (Fixed)</label>
                  <input type="text" class="form-control form-control-sm bg-light fw-bold font-monospace" [value]="editingEmployee.employeeId" disabled />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Full Name *</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="editingEmployee.name" name="editName" required autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Work Email *</label>
                  <input type="email" class="form-control form-control-sm" [(ngModel)]="editingEmployee.email" name="editEmail" required autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Designation</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="editingEmployee.designation" name="editDesignation" autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Department *</label>
                  <select class="form-select form-select-sm" [(ngModel)]="editingEmployee.department" name="editDept" required>
                    <option *ngFor="let d of stats?.deptStats" [value]="d.department">{{ d.department }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Level *</label>
                  <select class="form-select form-select-sm" [(ngModel)]="editingEmployee.level" name="editLevel" required>
                    <option value="L1">Level L1</option>
                    <option value="L2">Level L2</option>
                    <option value="L3">Level L3</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Mobile Phone</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="editingEmployee.mobilePhone" name="editPhone" autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">System Role</label>
                  <select class="form-select form-select-sm" [(ngModel)]="editingEmployee.role" name="editRole" required>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold small mb-1 text-dark">Reset Password (Optional)</label>
                  <input type="password" class="form-control form-control-sm" [(ngModel)]="editingEmployee.newPassword" name="editPassword" autocomplete="new-password" />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" (click)="showEditUserModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm px-4 fw-bold shadow-xs d-flex align-items-center gap-1" [disabled]="isSavingEditUser">
                  <span *ngIf="isSavingEditUser" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!isSavingEditUser" class="bi bi-check2-circle me-1"></i>
                  <span>{{ isSavingEditUser ? 'Saving...' : 'Save Profile Changes' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Register New User Modal -->
    <div class="modal fade show d-block bg-dark bg-opacity-50" tabIndex="-1" *ngIf="showRegisterUserModal" style="z-index: 1055;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header bg-primary text-white py-3 px-4 rounded-top-4">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <i class="bi bi-person-plus-fill fs-5"></i>
              Register New Employee User
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showRegisterUserModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div *ngIf="createUserSuccess" class="alert alert-success py-2.5 px-3 small alert-dismissible fade show rounded-3 mb-3">
              <i class="bi bi-check-circle-fill me-1"></i>{{ createUserSuccess }}
            </div>

            <div *ngIf="createUserErr" class="alert alert-danger py-2.5 px-3 small alert-dismissible fade show rounded-3 mb-3">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ createUserErr }}
            </div>

            <form (ngSubmit)="onCreateUser()" autocomplete="off">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Employee ID *</label>
                  <input type="text" class="form-control form-control-sm text-uppercase font-monospace fw-bold" [(ngModel)]="newEmployee.employeeId" name="regEmployeeId" required autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Full Name *</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="newEmployee.name" name="regName" required autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Email Address *</label>
                  <input type="email" class="form-control form-control-sm" [(ngModel)]="newEmployee.email" name="regEmail" required autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Designation</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="newEmployee.designation" name="regDesignation" autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Department *</label>
                  <select class="form-select form-select-sm" [(ngModel)]="newEmployee.department" name="regDept" required>
                    <option *ngFor="let d of stats?.deptStats" [value]="d.department">{{ d.department }}</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Level *</label>
                  <select class="form-select form-select-sm" [(ngModel)]="newEmployee.level" name="regLevel" required>
                    <option value="L1">Level L1</option>
                    <option value="L2">Level L2</option>
                    <option value="L3">Level L3</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">Mobile Phone</label>
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="newEmployee.mobilePhone" name="regPhone" autocomplete="off" />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold small mb-1 text-dark">System Role</label>
                  <select class="form-select form-select-sm" [(ngModel)]="newEmployee.role" name="regRole" required>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold small mb-1 text-dark">Password (Optional)</label>
                  <input type="password" class="form-control form-control-sm" [(ngModel)]="newEmployee.password" name="regPassword" autocomplete="new-password" />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" class="btn btn-outline-secondary btn-sm px-3 fw-semibold" (click)="showRegisterUserModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm px-4 fw-bold shadow-xs d-flex align-items-center gap-1" [disabled]="isCreatingUser">
                  <span *ngIf="isCreatingUser" class="spinner-border spinner-border-sm me-1"></span>
                  <i *ngIf="!isCreatingUser" class="bi bi-person-check-fill me-1"></i>
                  <span>{{ isCreatingUser ? 'Creating...' : 'Register User' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div class="container py-5 text-center" *ngIf="apiError">
      <div class="card border-0 shadow-sm rounded-4 p-5 col-md-6 mx-auto">
        <i class="bi bi-shield-lock-fill display-3 text-warning mb-3"></i>
        <h4 class="fw-bold text-dark">Admin Authentication Required</h4>
        <p class="text-muted mb-4">{{ apiError }}</p>
        <button class="btn btn-primary px-4 py-2 fw-bold" (click)="goToLogin()">
          <i class="bi bi-box-arrow-in-right me-1"></i> Log In as Admin (123456)
        </button>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  isDataLoading = false;
  apiError = '';
  activeTab: 'template-upload' | 'user-management' | 'exam-access' | 'attempts' = 'template-upload';

  stats: any = null;
  allAttempts: any[] = [];
  employees: any[] = [];

  // Department Management Search & Filter State
  deptSearchTerm = '';
  deptFilterMode: 'ALL' | 'ACTIVE' | 'EMPTY' = 'ALL';

  // User Directory Search & Filter State
  userSearchTerm = '';
  userDeptFilter = '';
  userLevelFilter = '';
  userRoleFilter = '';
  userPageSize = 25;
  userCurrentPage = 1;

  // Edit User Modal State
  showEditUserModal = false;
  editingEmployee: any = null;
  isSavingEditUser = false;
  editUserSuccess = '';
  editUserErr = '';

  // Register User Modal State
  showRegisterUserModal = false;

  // Exam Access & Single Attempt Control State
  examAccessList: any[] = [];
  selectedEmpIds: Set<string> = new Set();
  examAccessSearchTerm = '';
  examAccessDeptFilter = '';
  examAccessStatusFilter = 'ALL';
  isExamAccessLoading = false;
  isExamAccessAction = false;
  examAccessSuccessMsg = '';
  examAccessErrMsg = '';
  copiedEmpId: string | null = null;

  get filteredDeptStats(): any[] {
    if (!this.stats?.deptStats) return [];
    return this.stats.deptStats.filter((d: any) => {
      const term = this.deptSearchTerm.toLowerCase().trim();
      const matchesSearch = !term || d.department.toLowerCase().includes(term);
      const matchesFilter =
        this.deptFilterMode === 'ALL' ||
        (this.deptFilterMode === 'ACTIVE' && d.questionCount > 0) ||
        (this.deptFilterMode === 'EMPTY' && d.questionCount === 0);
      return matchesSearch && matchesFilter;
    });
  }

  get filteredEmployees(): any[] {
    if (!this.employees) return [];
    return this.employees.filter((e: any) => {
      const term = this.userSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (e.employeeId && e.employeeId.toLowerCase().includes(term)) ||
        (e.name && e.name.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.department && e.department.toLowerCase().includes(term)) ||
        (e.designation && e.designation.toLowerCase().includes(term)) ||
        (e.mobilePhone && e.mobilePhone.toLowerCase().includes(term));
      const matchesDept = !this.userDeptFilter || e.department === this.userDeptFilter;
      const matchesLevel = !this.userLevelFilter || e.level === this.userLevelFilter;
      const matchesRole = !this.userRoleFilter || e.role === this.userRoleFilter;
      return matchesSearch && matchesDept && matchesLevel && matchesRole;
    });
  }

  get paginatedEmployees(): any[] {
    const list = this.filteredEmployees;
    if (this.userPageSize >= 10000) return list;
    const start = (this.userCurrentPage - 1) * this.userPageSize;
    return list.slice(start, start + this.userPageSize);
  }

  get userTotalPages(): number {
    if (this.userPageSize >= 10000) return 1;
    return Math.ceil(this.filteredEmployees.length / this.userPageSize) || 1;
  }

  get filteredExamAccessList(): any[] {
    if (!this.examAccessList) return [];
    return this.examAccessList.filter((e: any) => {
      const term = this.examAccessSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        e.employeeId.toLowerCase().includes(term) ||
        e.name.toLowerCase().includes(term) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.designation && e.designation.toLowerCase().includes(term));
      const matchesDept = !this.examAccessDeptFilter || e.department === this.examAccessDeptFilter;
      const status = e.examAccess?.computedStatus || e.examAccess?.status || 'NOT_ASSIGNED';
      const matchesStatus =
        this.examAccessStatusFilter === 'ALL' ||
        status === this.examAccessStatusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  countExamStatus(status: string): number {
    if (!this.examAccessList) return 0;
    return this.examAccessList.filter(
      (e: any) => (e.examAccess?.computedStatus || e.examAccess?.status) === status
    ).length;
  }

  isAllExamSelected(): boolean {
    const list = this.filteredExamAccessList;
    if (list.length === 0) return false;
    return list.every((e: any) => this.selectedEmpIds.has(e.employeeId));
  }

  // Department Template Selection
  selectedDepartment = 'I&C';
  uploadMode: 'REPLACE' | 'APPEND' = 'REPLACE';

  selectedFile: File | null = null;
  isUploading = false;
  uploadSuccessMsg = '';
  uploadErrMsg = '';
  showUploadModal = false;

  // Bulk Employee Excel Upload State
  showEmpUploadModal = false;
  selectedEmpFile: File | null = null;
  isEmpUploading = false;
  empUploadSuccessMsg = '';
  empUploadErrMsg = '';

  // New Employee Registration Form State
  newEmployee = {
    employeeId: '',
    name: '',
    email: '',
    designation: '',
    department: 'I&C',
    level: 'L1',
    mobilePhone: '',
    role: 'EMPLOYEE',
    password: '',
  };
  isCreatingUser = false;
  createUserSuccess = '';
  createUserErr = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshDashboardData();
  }

  refreshDashboardData(): void {
    this.isDataLoading = true;
    this.apiError = '';

    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.isDataLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching admin stats:', err);
        this.isDataLoading = false;
        this.apiError = err.error?.message || 'Access denied or session expired. Please log in as Admin.';
        this.cdr.detectChanges();
      },
    });

    this.adminService.getAllAttempts().subscribe({
      next: (res) => {
        this.allAttempts = res;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
    this.adminService.getEmployees().subscribe({
      next: (res) => {
        this.employees = res;
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.loadExamAccessList();
  }

  openUploadModal(dept: string): void {
    this.selectedDepartment = dept;
    this.selectedFile = null;
    this.uploadSuccessMsg = '';
    this.uploadErrMsg = '';
    this.showUploadModal = true;
  }

  goToLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openRegisterUserModal(): void {
    this.newEmployee = {
      employeeId: '',
      name: '',
      email: '',
      designation: '',
      department: 'I&C',
      level: 'L1',
      mobilePhone: '',
      role: 'EMPLOYEE',
      password: '',
    };
    this.createUserSuccess = '';
    this.createUserErr = '';
    this.showRegisterUserModal = true;
  }

  onCreateUser(): void {
    if (!this.newEmployee.employeeId || !this.newEmployee.name || !this.newEmployee.email) {
      this.createUserErr = 'Please fill out all required fields (Employee ID, Name, Email).';
      return;
    }

    // Default password to Employee ID if left blank
    if (!this.newEmployee.password || !this.newEmployee.password.trim()) {
      this.newEmployee.password = this.newEmployee.employeeId.trim();
    }

    this.isCreatingUser = true;
    this.createUserSuccess = '';
    this.createUserErr = '';

    this.adminService.createEmployee(this.newEmployee).subscribe({
      next: (res) => {
        this.isCreatingUser = false;
        this.createUserSuccess = res.message || 'User registered successfully!';
        this.newEmployee = {
          employeeId: '',
          name: '',
          email: '',
          designation: '',
          department: 'I&C',
          level: 'L1',
          mobilePhone: '',
          role: 'EMPLOYEE',
          password: '',
        };
        this.refreshDashboardData();
        setTimeout(() => {
          this.showRegisterUserModal = false;
          this.createUserSuccess = '';
          this.cdr.detectChanges();
        }, 1200);
      },
      error: (err) => {
        this.isCreatingUser = false;
        this.createUserErr = err.error?.message || 'Failed to create user profile.';
        this.cdr.detectChanges();
      },
    });
  }

  openEditUserModal(emp: any): void {
    this.editingEmployee = {
      _id: emp._id,
      employeeId: emp.employeeId,
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'I&C',
      level: emp.level || 'L1',
      designation: emp.designation || '',
      mobilePhone: emp.mobilePhone || '',
      role: emp.role || 'EMPLOYEE',
      newPassword: '',
    };
    this.editUserSuccess = '';
    this.editUserErr = '';
    this.showEditUserModal = true;
  }

  onSaveEditUser(): void {
    if (!this.editingEmployee || !this.editingEmployee.name || !this.editingEmployee.email) {
      this.editUserErr = 'Full Name and Email Address are required.';
      return;
    }

    this.isSavingEditUser = true;
    this.editUserSuccess = '';
    this.editUserErr = '';

    const payload: any = {
      name: this.editingEmployee.name,
      email: this.editingEmployee.email,
      department: this.editingEmployee.department,
      level: this.editingEmployee.level,
      designation: this.editingEmployee.designation,
      mobilePhone: this.editingEmployee.mobilePhone,
      role: this.editingEmployee.role,
    };
    if (this.editingEmployee.newPassword && this.editingEmployee.newPassword.trim()) {
      payload.password = this.editingEmployee.newPassword.trim();
    }

    this.adminService.updateEmployee(this.editingEmployee._id, payload).subscribe({
      next: (res) => {
        this.isSavingEditUser = false;
        this.editUserSuccess = res.message || 'Profile updated successfully!';
        this.refreshDashboardData();
        setTimeout(() => {
          this.showEditUserModal = false;
          this.editingEmployee = null;
          this.editUserSuccess = '';
          this.cdr.detectChanges();
        }, 1200);
      },
      error: (err) => {
        this.isSavingEditUser = false;
        this.editUserErr = err.error?.message || 'Failed to update user profile.';
        this.cdr.detectChanges();
      },
    });
  }

  onDeleteUser(emp: any): void {
    if (confirm(`Are you sure you want to delete user ${emp.name} (${emp.employeeId})?`)) {
      this.adminService.deleteEmployee(emp._id).subscribe({
        next: (res) => {
          alert(res.message);
          this.refreshDashboardData();
        },
        error: (err) => alert(err.error?.message || 'Error deleting employee.'),
      });
    }
  }

  exportActiveQuestions(dept?: string): void {
    const targetDept = dept || this.selectedDepartment;
    this.adminService.exportQuestionsData(targetDept).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeDept = targetDept.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${safeDept}_Active_Questions.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to export active question data. Make sure you are logged in as Admin.'),
    });
  }

  downloadExcelTemplate(dept?: string): void {
    const targetDept = dept || this.selectedDepartment;
    this.adminService.downloadExcelTemplate(targetDept).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeDept = targetDept.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${safeDept}_Question_Template.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to download Excel template. Make sure you are logged in as Admin.'),
    });
  }

  downloadWordTemplate(dept?: string): void {
    const targetDept = dept || this.selectedDepartment;
    this.adminService.downloadWordTemplate(targetDept).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeDept = targetDept.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${safeDept}_Question_Template.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to download Word template. Make sure you are logged in as Admin.'),
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.docx'))) {
      this.selectedFile = file;
      this.uploadErrMsg = '';
    } else {
      this.selectedFile = null;
      this.uploadErrMsg = 'Please select a valid Excel (.xlsx) or Word (.docx) file.';
    }
  }

  uploadTemplateFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadSuccessMsg = '';
    this.uploadErrMsg = '';

    this.adminService.uploadTemplateFile(this.selectedFile, this.selectedDepartment, this.uploadMode).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.uploadSuccessMsg = res.message;
        this.selectedFile = null;
        this.refreshDashboardData();
        setTimeout(() => {
          this.showUploadModal = false;
        }, 1500);
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadErrMsg = err.error?.message || 'Error processing template file. Check format.';
      },
    });
  }

  openEmpUploadModal(): void {
    this.selectedEmpFile = null;
    this.empUploadSuccessMsg = '';
    this.empUploadErrMsg = '';
    this.showEmpUploadModal = true;
  }

  downloadEmployeeTemplate(): void {
    this.adminService.downloadEmployeeTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Employee_Import_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to download Employee template. Make sure you are logged in as Admin.'),
    });
  }

  onEmpFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      this.selectedEmpFile = file;
      this.empUploadErrMsg = '';
    } else {
      this.selectedEmpFile = null;
      this.empUploadErrMsg = 'Please select a valid Excel (.xlsx) file.';
    }
  }

  uploadEmployeeExcel(): void {
    if (!this.selectedEmpFile) return;

    this.isEmpUploading = true;
    this.empUploadSuccessMsg = '';
    this.empUploadErrMsg = '';

    this.adminService.uploadEmployeeExcel(this.selectedEmpFile).subscribe({
      next: (res) => {
        this.isEmpUploading = false;
        this.empUploadSuccessMsg = res.message;
        this.selectedEmpFile = null;
        this.refreshDashboardData();
        setTimeout(() => {
          this.showEmpUploadModal = false;
        }, 1800);
      },
      error: (err) => {
        this.isEmpUploading = false;
        this.empUploadErrMsg = err.error?.message || 'Error processing Employee Excel file.';
      },
    });
  }

  // Exam Access & Attempt Control Methods
  loadExamAccessList(): void {
    this.isExamAccessLoading = true;
    this.adminService.getExamAccessList().subscribe({
      next: (res) => {
        this.examAccessList = res || [];
        this.isExamAccessLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load exam access roster:', err);
        this.isExamAccessLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleSelectAllExam(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.filteredExamAccessList.forEach((e: any) => this.selectedEmpIds.add(e.employeeId));
    } else {
      this.filteredExamAccessList.forEach((e: any) => this.selectedEmpIds.delete(e.employeeId));
    }
    this.cdr.detectChanges();
  }

  toggleSelectEmp(empId: string): void {
    if (this.selectedEmpIds.has(empId)) {
      this.selectedEmpIds.delete(empId);
    } else {
      this.selectedEmpIds.add(empId);
    }
    this.cdr.detectChanges();
  }

  enableSelectedExamLinks(): void {
    if (this.selectedEmpIds.size === 0) return;
    const ids = Array.from(this.selectedEmpIds);
    this.isExamAccessAction = true;
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';

    this.adminService.enableExamLinks(ids).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = res.message || `Exam link enabled for ${ids.length} employee(s) (1 attempt allowed)!`;
        this.selectedEmpIds.clear();
        this.isExamAccessAction = false;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to enable exam links.';
        this.isExamAccessAction = false;
        this.cdr.detectChanges();
      },
    });
  }

  grantReattemptForSelected(): void {
    if (this.selectedEmpIds.size === 0) return;
    const ids = Array.from(this.selectedEmpIds);
    this.isExamAccessAction = true;
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';

    this.adminService.grantReattempt(ids, undefined).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = res.message || `Re-attempt permission granted for ${ids.length} employee(s)!`;
        this.selectedEmpIds.clear();
        this.isExamAccessAction = false;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to grant re-attempt.';
        this.isExamAccessAction = false;
        this.cdr.detectChanges();
      },
    });
  }

  revokeSelectedExamLinks(): void {
    if (this.selectedEmpIds.size === 0) return;
    const ids = Array.from(this.selectedEmpIds);
    this.isExamAccessAction = true;
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';

    this.adminService.revokeExamLink(ids).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = res.message || `Access revoked for ${ids.length} selected employee(s).`;
        this.selectedEmpIds.clear();
        this.isExamAccessAction = false;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to revoke exam link.';
        this.isExamAccessAction = false;
        this.cdr.detectChanges();
      },
    });
  }

  enableExamLinkSingle(emp: any): void {
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';
    this.adminService.enableExamLinks([emp.employeeId]).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = `Exam link enabled for ${emp.name} (${emp.employeeId})!`;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to enable link.';
        this.cdr.detectChanges();
      },
    });
  }

  grantReattemptSingle(emp: any): void {
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';
    this.adminService.grantReattempt(emp.employeeId).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = `Permission granted! ${emp.name} (${emp.employeeId}) can now take 1 more attempt.`;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to grant re-attempt.';
        this.cdr.detectChanges();
      },
    });
  }

  revokeExamLinkSingle(emp: any): void {
    this.examAccessSuccessMsg = '';
    this.examAccessErrMsg = '';
    this.adminService.revokeExamLink(emp.employeeId).subscribe({
      next: (res) => {
        this.examAccessSuccessMsg = `Exam access revoked for ${emp.name}.`;
        this.loadExamAccessList();
      },
      error: (err) => {
        this.examAccessErrMsg = err.error?.message || 'Failed to revoke access.';
        this.cdr.detectChanges();
      },
    });
  }

  copyDirectExamLink(emp: any): void {
    const origin = window.location.origin;
    const directLink = `${origin}/login?empId=${emp.employeeId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directLink).then(() => {
        this.copiedEmpId = emp.employeeId;
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.copiedEmpId === emp.employeeId) {
            this.copiedEmpId = null;
            this.cdr.detectChanges();
          }
        }, 3000);
      });
    }
  }
}
