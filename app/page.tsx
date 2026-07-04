import { redirect } from 'next/navigation';

export default function Home() {
  // ওয়েবসাইট ওপেন হওয়া মাত্রই এটি ইউজারকে /login লিংকে পাঠিয়ে দেবে
  redirect('/login');
}