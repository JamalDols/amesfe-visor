import Link from "next/link";
import Image from "next/image";
import HomeAlbumGallery from "@/components/HomeAlbumGallery";

export default function HomePage() {
  return (
    <div>
      {/* Header con navegación */}
      <div className="bg-white" id="header" style={{ boxShadow: "0px 12px 18px -6px rgba(0,0,0,0.3)" }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Image src="/logo-amesfe.png" alt="Logo AMESFE" width={120} height={115} className="" />
            </div>
            <div className="flex gap-4 items-center">
              <Link href="https://amesfe.org/" target="_blank" className="font-bold text-[22px] text-[#354564] hover:text-[#6DBCB9] transition-colors duration-300">
                Inicio
              </Link>
              <Link href="https://amesfe.org/noticias/" target="_blank" className="font-bold text-[22px] text-[#354564] hover:text-[#6DBCB9] transition-colors duration-300">
                Noticias
              </Link>
              <Link href="https://amesfe.org/area-privada/" target="_blank" className="font-bold text-[22px] text-[#354564] hover:text-[#6DBCB9] transition-colors duration-300">
                Área privada
              </Link>

              <Link href="/admin" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <HomeAlbumGallery />
    </div>
  );
}
