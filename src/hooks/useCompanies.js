import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/api/company.api';
import toast from 'react-hot-toast';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn:  () => companyApi.list({ per_page: 50 }),
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['company', id],
    queryFn:  () => companyApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => companyApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to create company.'),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => companyApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to update company.'),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted.');
    },
  });
}

export function useUploadCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => companyApi.uploadLogo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Logo updated.');
    },
    onError: () => toast.error('Logo upload failed.'),
  });
}

export function useUploadCompanySeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => companyApi.uploadSeal(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Seal updated.');
    },
    onError: () => toast.error('Seal upload failed.'),
  });
}