import { LanguageIcon, CloseIcon } from '@contentful/f36-icons';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

export const LanguageSelectorMobile = ({ localeName, displayName }) => {
  const { locale, locales } = useRouter();
  const router = useRouter();
  const { t } = useTranslation();
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      {showDrawer ? (
        <span
          className="fixed right-10 top-6 z-50 flex cursor-pointer items-center"
          onClick={() => setShowDrawer(!showDrawer)}
          role="button"
          tabIndex={0}>
          <CloseIcon width="18px" height="18px" variant="secondary" />
        </span>
      ) : (
        <span
          onClick={() => setShowDrawer(!showDrawer)}
          role="button"
          tabIndex={0}
          className="fixed right-10 top-6 z-30 flex cursor-pointer items-center">
          <LanguageIcon width="18px" height="18px" variant="secondary" />
        </span>
      )}

      <div
        className={twMerge(
          `fixed top-0 right-0 z-40 h-full w-[80vw] bg-colorWhite pt-5 pl-5 duration-300 ease-in-out`,
          showDrawer ? 'translate-x-0' : 'translate-x-full',
        )}>
        <h2 className="py-4 text-xl font-semibold">{t('common.regionalSettings')}</h2>
        <>
          <p className="pb-2 text-base font-semibold"> {t('common.language')}</p>
          <select
            className="block w-9/12 rounded-md border border-gray300 p-2.5 text-sm"
            defaultValue={locale}
            onChange={event => {
              router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
                locale: String(event.target.value),
              });
              setShowDrawer(!showDrawer);
            }}>
            {locales?.map(availableLocale => (
              <option key={availableLocale} value={availableLocale}>
                {displayName(availableLocale).of(localeName(availableLocale))}
              </option>
            ))}
          </select>
        </>
      </div>
    </>
  );
};
