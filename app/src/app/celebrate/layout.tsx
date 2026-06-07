import ImmersiveHeader from '@/components/ImmersiveHeader';

export default function CelebrateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImmersiveHeader />
      {children}
    </>
  );
}
