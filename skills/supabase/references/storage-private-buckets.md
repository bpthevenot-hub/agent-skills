# Private storage and short-lived download links

Keep the `user-documents` bucket private. For the path
`private/<user-id>/<filename>`, the owner is folder **2**, while folder 1 is the
literal `private` prefix. Bind every policy to the intended bucket as well.

```sql
create policy "Read own private documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'user-documents'
  and (storage.foldername(name))[1] = 'private'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
```

Using an authenticated client with that SELECT policy:

```ts
const { data, error } = await supabase.storage
  .from('user-documents')
  .createSignedUrl(`private/${user.id}/report.pdf`, 60);
if (error) throw error;
return data.signedUrl;
```

A signed URL is a bearer credential until expiry: keep it out of logs,
analytics, public source and shared caches. Its creation checks permissions;
the resulting link can be used by anyone possessing it. A server using a
secret key must enforce ownership itself before issuing the link.

Uploads need a separate INSERT policy with `WITH CHECK`; replacement also
requires SELECT and UPDATE. Check existing policies for broader grants. Test
the owner, another user, a signed-out request, the wrong bucket and expiry.

Source: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
