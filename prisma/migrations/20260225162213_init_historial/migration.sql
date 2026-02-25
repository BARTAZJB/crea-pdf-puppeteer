-- CreateTable
CREATE TABLE "RegistroPDF" (
    "id" SERIAL NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "nombreUsuario" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plantilla" TEXT NOT NULL,
    "archivoPath" TEXT NOT NULL,

    CONSTRAINT "RegistroPDF_pkey" PRIMARY KEY ("id")
);
