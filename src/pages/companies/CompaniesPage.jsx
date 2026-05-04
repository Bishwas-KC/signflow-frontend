import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { companyApi } from '@/api/company.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Building2, Plus, Edit3, Trash2, Globe, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Info', 'Contact', 'Address', 'Branding'];

function CompanyForm({ company, onSuccess, onClose }) {
  const [tab, setTab] = useState('Info');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: company ? {
      name: company.info?.name, registration_number: company.info?.registration_number,
      pan_number: company.info?.pan_number, industry: company.info?.industry,
      established_date: company.info?.established_date,
      phone: company.contact?.phone, email: company.contact?.email, website: company.contact?.website,
      street_address: company.address?.street_address, city: company.address?.city,
      district: company.address?.district, province: company.address?.province,
      country: company.address?.country,
    } : { country: 'Nepal' },
  });

  const save = async (data) => {
    try {
      if (company) await companyApi.update(company.id, data);
      else         await companyApi.create(data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save company.');
    }
  };

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 -mx-6 px-6 mb-4">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 'Info' && (
        <div className="space-y-4">
          <Input label="Company Name *" {...register('name', { required: true })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Registration Number" {...register('registration_number')} />
            <Input label="PAN Number" {...register('pan_number')} />
            <Input label="Industry" placeholder="Technology" {...register('industry')} />
            <Input label="Established Date" type="date" {...register('established_date')} />
          </div>
        </div>
      )}

      {tab === 'Contact' && (
        <div className="space-y-4">
          <Input label="Phone" placeholder="+977-1-..." {...register('phone')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Website" placeholder="https://..." {...register('website')} />
        </div>
      )}

      {tab === 'Address' && (
        <div className="space-y-4">
          <Input label="Street Address" {...register('street_address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="District" {...register('district')} />
            <Input label="Province" {...register('province')} />
            <Input label="Country" {...register('country')} />
          </div>
        </div>
      )}

      {tab === 'Branding' && (
        <div className="space-y-4">
          {company && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Company Logo</p>
                <div className="flex items-center gap-3">
                  {company.branding?.logo_url && (
                    <img src={company.branding.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" />
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        try { await companyApi.uploadLogo(company.id, f); toast.success('Logo updated.'); onSuccess(); }
                        catch { toast.error('Logo upload failed.'); }
                      }} />
                    <span className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      Upload Logo
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Company Seal</p>
                <div className="flex items-center gap-3">
                  {company.branding?.seal_url && (
                    <img src={company.branding.seal_url} alt="Seal" className="w-16 h-16 object-contain rounded-lg border" />
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        try { await companyApi.uploadSeal(company.id, f); toast.success('Seal updated.'); onSuccess(); }
                        catch { toast.error('Seal upload failed.'); }
                      }} />
                    <span className="text-sm text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      Upload Seal
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}
          {!company && <p className="text-sm text-gray-500">Save the company first, then upload logo and seal.</p>}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {company ? 'Save Changes' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [modal, setModal]     = useState(null);
  const [deleteTarget, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn:  () => companyApi.list({ per_page: 50 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted.');
      setDel(null);
    },
  });

  const companies = data?.data || [];

  const onFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    toast.success(modal?.id ? 'Company updated.' : 'Company created.');
    setModal(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Companies"
        description="Manage your business profiles and branding assets."
        action={<Button size="lg" className="rounded-xl shadow-lg shadow-indigo-500/20" onClick={() => setModal('create')}><Plus size={18} />Add Company</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : companies.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <EmptyState
            icon={Building2} title="No companies yet"
            description="Register your company to enable custom branding on your signed documents."
            action={<Button variant="secondary" className="rounded-xl" onClick={() => setModal('create')}><Plus size={16} />Add Company</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-6">
                {c.branding?.logo_url ? (
                  <div className="w-12 h-12 bg-white rounded-xl border border-gray-100 p-1 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <img src={c.branding.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.info?.name}</p>
                  {c.info?.industry && <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mt-0.5">{c.info.industry}</p>}
                  {c.user_role && (
                    <span className="inline-flex mt-2 text-[10px] font-black uppercase tracking-tighter bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                      {c.user_role}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 mb-6 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                {c.contact?.phone && (
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-slate-400">
                    <Phone size={14} className="text-gray-400" />{c.contact.phone}
                  </div>
                )}
                {c.contact?.email && (
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-slate-400">
                    <Mail size={14} className="text-gray-400" />{c.contact.email}
                  </div>
                )}
                {c.contact?.website && (
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-slate-400">
                    <Globe size={14} className="text-gray-400" />{c.contact.website}
                  </div>
                )}
                {c.address?.city && (
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide mt-2">
                    {[c.address.city, c.address.province, c.address.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-5 border-t border-gray-50 dark:border-slate-800/50">
                <button onClick={() => setModal(c)}
                  className="flex-1 text-xs font-bold text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all">
                  <Edit3 size={14} />Edit Profile
                </button>
                <button onClick={() => setDel(c)}
                  className="flex-1 text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition-all">
                  <Trash2 size={14} />Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

     <Modal
    open={!!modal}
    onClose={() => setModal(null)}
    title={modal?.id ? 'Edit Company' : 'Add Company'}
    size="lg"
>
    <CompanyForm
        key={modal?.id ?? 'new'}    
        company={modal?.id ? modal : null}
        onSuccess={onFormSuccess}
        onClose={() => setModal(null)}
    />
</Modal>
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDel(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        loading={deleteMut.isPending}
        title="Remove Company?"
        message={`This will permanently remove "${deleteTarget?.info?.name}" and all associated branding assets. Continue?`}
        confirmLabel="Confirm Removal"
      />
    </div>
  );
}