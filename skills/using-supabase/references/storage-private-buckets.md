---
title: Use Private Buckets with Signed URLs
impact: MEDIUM-HIGH
impactDescription: Prevents unauthorized public access to user-uploaded files
tags: storage, buckets, signed-urls, access-control
---

## Use Private Buckets with Signed URLs

Storage buckets default to private, but making a bucket public is one click — and then every file is reachable by anyone with the URL. Keep buckets private and hand out short-lived signed URLs for downloads, backed by RLS policies on `storage.objects`.

**Incorrect:**

```ts
// Public bucket: anyone on the internet can enumerate and download
// every file, forever, with no auth check.
const { data } = supabase.storage
  .from("user-documents") // bucket set to public
  .getPublicUrl("passport-scan.pdf");
```

**Correct:**

```ts
// Private bucket + signed URL valid for 60 seconds, issued only
// after a server-side authorization check.
const { data, error } = await supabase.storage
  .from("user-documents")
  .createSignedUrl(`private/${user.id}/passport-scan.pdf`, 60);

if (error) throw error;
return data.signedUrl;
```

Add an RLS policy on `storage.objects` restricting access to the owning user's folder, e.g. `(storage.foldername(name))[1] = auth.uid()::text`.
