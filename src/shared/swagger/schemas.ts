import 'reflect-metadata';
import { createRequire } from 'module';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

import '../pagination/pagination-query.dto';
import '../../modules/employee/application/create-employee.dto';
import '../../modules/employee/application/update-employee.dto';
import '../../modules/employee/application/employee-query.dto';
import '../../modules/attendance/application/check-in.dto';
import '../../modules/attendance/application/check-out.dto';
import '../../modules/attendance/application/update-attendance.dto';
import '../../modules/attendance/application/attendance-query.dto';

const requireModule = createRequire(__filename);

const getClassTransformerMetadataStorage = () => {
  const candidatePaths = ['class-transformer/cjs/storage', 'class-transformer/storage', 'class-transformer/esm5/storage'];

  for (const path of candidatePaths) {
    try {
      return requireModule(path).defaultMetadataStorage;
    } catch {
      continue;
    }
  }

  return undefined;
};

export const buildSwaggerDefinitions = (): Record<string, unknown> => {
  const classTransformerMetadataStorage = getClassTransformerMetadataStorage();

  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
    ...(classTransformerMetadataStorage ? { classTransformerMetadataStorage } : {}),
  });

  return schemas as Record<string, unknown>;
};
