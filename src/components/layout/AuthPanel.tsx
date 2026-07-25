import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/cloudkit-new.png';

type AuthPanelProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: ReactNode;
  footerLabel: string;
  footerLinkLabel: string;
  footerLinkTo: string;
};

export default function AuthPanel({
  eyebrow,
  title,
  subtitle,
  cta,
  footerLabel,
  footerLinkLabel,
  footerLinkTo,
}: AuthPanelProps) {
  return (
    <div className="ck-page">
      <div className="ck-content flex min-h-screen items-center justify-center px-4 py-10">
        <div className="ck-shell grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="ck-card relative overflow-hidden p-8 md:p-12">
            <div className="ck-orb left-[-60px] top-[-40px] h-44 w-44 bg-[#3ed0ff]/30" />
            <div className="ck-orb bottom-[-50px] right-[-30px] h-36 w-36 bg-[#c3ff68]/18" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <img
                      src={logo}
                      alt="CloudKit"
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-lg font-semibold tracking-[-0.04em] text-white">
                      CloudKit
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#89a0b8]">
                      Fast shipping for frontend teams
                    </div>
                  </div>
                </div>
                <p className="ck-kicker">{eyebrow}</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-white md:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-[#9aa9bc] md:text-lg">
                  {subtitle}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Live logs', 'Follow websocket build output in real time.'],
                  ['Repo import', 'Pull GitHub repos into a deployment flow instantly.'],
                  ['Preview URLs', 'Ship and review every release with clean share links.'],
                ].map(([label, desc]) => (
                  <div
                    key={label}
                    className="rounded-[22px] border border-white/8 bg-white/4 p-4"
                  >
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="mt-2 text-sm leading-6 text-[#89a0b8]">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="ck-card flex items-center p-6 md:p-10">
            <div className="w-full">
              <div className="rounded-[26px] border border-white/8 bg-[#07111b]/86 p-6 md:p-8">
                {cta}
                <div className="mt-8 text-center text-sm text-[#89a0b8]">
                  {footerLabel}{' '}
                  <Link
                    to={footerLinkTo}
                    className="font-semibold text-[#c3ff68] no-underline"
                  >
                    {footerLinkLabel}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
