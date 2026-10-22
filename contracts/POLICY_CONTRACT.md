# AEGISAI Policy Contract — SOURCE OF TRUTH

Policy identifiers must remain stable across all three members.

1. NO_CROSS_TENANT_SECRET_ACCESS
   Red Team cannot read Blue Team protected secrets.

2. NO_UNAUTHORIZED_FILE_ACCESS
   Protected files cannot be accessed across unauthorized boundaries.

3. LLM_PROTECTED_CONTEXT
   Client LLM receives only permitted/sanitized context.

4. CROSS_BOUNDARY_AUTHORIZATION
   Cross-boundary actions require authorization.

5. AUDIT_ALL_SECURITY_DECISIONS
   Every security decision produces an audit event.

A denied response must expose decision metadata, not protected content.
