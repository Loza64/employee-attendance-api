export interface PublicEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  position: string;
}

export class Employee {
  id: string = '';
  employeeCode: string = '';
  name: string = '';
  email: string = '';
  department: string = '';
  position: string = '';
  hireDate: string = '';
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  toSummary(): EmployeeSummary {
    return {
      id: this.id,
      employeeCode: this.employeeCode,
      name: this.name,
      department: this.department,
      position: this.position,
    };
  }

  toPublic(): PublicEmployee {
    return {
      id: this.id,
      employeeCode: this.employeeCode,
      name: this.name,
      email: this.email,
      department: this.department,
      position: this.position,
      hireDate: this.hireDate,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
