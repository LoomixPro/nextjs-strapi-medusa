import { errors } from '@strapi/utils';
const { ValidationError } = errors;

function validateUniqueModules(data: any) {
  if (data && data.modules && Array.isArray(data.modules)) {
    const seen = new Set<string>();
    for (const module of data.modules) {
      const comp = module.__component;
      if (comp) {
        if (seen.has(comp)) {
          throw new ValidationError(
            `Validation Error: Duplicate components are not allowed. Component "${comp}" has already been added.`
          );
        }
        seen.add(comp);
      }
    }
  }
}

export default {
  beforeCreate(event: any) {
    validateUniqueModules(event.params.data);
  },
  beforeUpdate(event: any) {
    validateUniqueModules(event.params.data);
  },
};
