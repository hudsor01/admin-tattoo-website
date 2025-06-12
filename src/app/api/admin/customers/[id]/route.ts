import { createResourceHandlers } from '@/lib/api-helpers';
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/db-operations';
import { updateCustomerSchema } from '@/lib/validations';

// Create resource handlers using the helper
const { GET, PATCH, DELETE } = createResourceHandlers(
  'Customer',
  {
    getById: getCustomerById,
    update: updateCustomer,
    delete: deleteCustomer,
  },
  {
    update: updateCustomerSchema,
  }
);

export { GET, PATCH, DELETE };