import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/upload'); // ✅ Isso funciona corretamente
}

