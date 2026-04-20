// Re-export from AuthContext for consistent import paths
// Usage: import { useAuth } from '@/hooks/useAuth'
export { useAuth } from '@/context/AuthContext';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactApi } from '@/api/contact.api';
import toast from 'react-hot-toast';

export function useContacts(params = {}) {
  return useQuery({
    queryKey:        ['contacts', params],
    queryFn:         () => contactApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: ['contact-stats'],
    queryFn:  contactApi.stats,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => contactApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact added.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to add contact.'),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => contactApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated.');
    },
    onError: (err) =>
      toast.error(err.response?.data?.error?.message || 'Failed to update contact.'),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => contactApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success('Contact deleted.');
    },
  });
}

export function useBulkDeleteContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => contactApi.bulkDelete(ids),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success(`${res.data.deleted_count} contact(s) deleted.`);
    },
  });
}