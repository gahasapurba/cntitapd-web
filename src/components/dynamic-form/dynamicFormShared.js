// Helpers & constants shared by the component and its sections.

export const TEXT_MAX_LENGTH = 200;

export const TEXTAREA_MAX_LENGTH = 2000;

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const DEFAULT_FILE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';

export function isFileAccepted(file, accept) {
  const rules = String(accept || DEFAULT_FILE_ACCEPT).split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule === '*/*') return true;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}
