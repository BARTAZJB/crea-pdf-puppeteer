-- AlterTable
ALTER TABLE "RegistroPDF" ADD COLUMN     "datosFormatoId" INTEGER;

-- CreateTable
CREATE TABLE "DatosFormato" (
    "id" SERIAL NOT NULL,
    "nombreUsuario" TEXT NOT NULL,
    "plantilla" TEXT NOT NULL,
    "datosJson" JSONB NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatosFormato_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistroPDF" ADD CONSTRAINT "RegistroPDF_datosFormatoId_fkey" FOREIGN KEY ("datosFormatoId") REFERENCES "DatosFormato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
