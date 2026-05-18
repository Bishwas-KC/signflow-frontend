import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { documentApi } from '@/api/document.api';
import toast from 'react-hot-toast';

export function useDocuments(params = {}) {
 return useQuery({
 queryKey: ['documents', params],
 queryFn: () => documentApi.list(params),
 placeholderData: keepPreviousData,
 });
}

export function useDocument(id) {
 return useQuery({
 queryKey: ['document', id],
 queryFn: () => documentApi.get(id),
 enabled: !!id,
 refetchInterval: 30_000, // live status updates
 });
}

export function useDocumentStats() {
 return useQuery({
 queryKey: ['document-stats'],
 queryFn: documentApi.stats,
 });
}

export function useCreateDocument() {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: ({ data, file }) => documentApi.create(data, file),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ['documents'] });
 qc.invalidateQueries({ queryKey: ['document-stats'] });
 },
 onError: (err) =>
 toast.error(err.response?.data?.error?.message || 'Failed to create document.'),
 });
}

export function useDeleteDocument() {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: (id) => documentApi.delete(id),
  onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['document', String(id)] });
 qc.invalidateQueries({ queryKey: ['documents'] });
 qc.invalidateQueries({ queryKey: ['document-stats'] });
 toast.success('Document deleted.');
 },
 onError: (err) =>
 toast.error(err.response?.data?.error?.message || 'Failed to delete.'),
 });
}
export function useSendDocument() {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: (id) => documentApi.send(id),
 onSuccess: (_, id) => {
 // id from mutate() is whatever was passed — could be number or string
 // queryKey uses ['document', id] where id comes from useParams() as string
 qc.invalidateQueries({ queryKey: ['document', String(id)] });
 qc.invalidateQueries({ queryKey: ['documents'] });
 qc.invalidateQueries({ queryKey: ['document-stats'] });
 toast.success('Document sent to signers!');
 },
 onError: (err) =>
 toast.error(err.response?.data?.error?.message || 'Failed to send.'),
 });
}

export function useCancelDocument() {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: (id) => documentApi.cancel(id),
 onSuccess: (_, id) => {
 qc.invalidateQueries({ queryKey: ['document', String(id)] });
 qc.invalidateQueries({ queryKey: ['documents'] });
 toast.success('Document cancelled.');
 },
 });
}

export function useAddSigner(id) {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: (data) => documentApi.addSigner(id, data),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: ['document', String(id)] });
 toast.success('Signer added.');
 },
 onError: (err) =>
 toast.error(err.response?.data?.error?.message || 'Failed to add signer.'),
 });
}

export function useAddField(documentId) {
 const qc = useQueryClient();
 return useMutation({
 mutationFn: (data) => documentApi.addField(documentId, data),
 onSuccess: () => qc.invalidateQueries({ queryKey: ['document', String(documentId)] }),
 onError: (err) =>
 toast.error(err.response?.data?.error?.message || 'Failed to add field.'),
 });
}