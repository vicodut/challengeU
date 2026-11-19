import { useTranslation } from 'react-i18next';
import { Link, useMatches } from 'react-router';

/** A route opts into the trail with `handle: { crumb: '<i18n key>' }`. */
function crumbKey(handle: unknown): string | undefined {
  if (typeof handle !== 'object' || handle === null || !('crumb' in handle)) return undefined;
  return typeof handle.crumb === 'string' ? handle.crumb : undefined;
}

export function Breadcrumbs() {
  const { t } = useTranslation();
  const trail = useMatches().flatMap((match) => {
    const key = crumbKey(match.handle);
    return key ? [{ pathname: match.pathname, label: t(key) }] : [];
  });

  return (
    <nav aria-label={t('breadcrumb.label')}>
      <ol className="text-muted-foreground flex flex-wrap gap-2 text-sm">
        {trail.map((crumb, index) => (
          <li key={crumb.pathname} className="flex gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {index === trail.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.pathname}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
