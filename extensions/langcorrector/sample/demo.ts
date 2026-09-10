// Abre esta carpeta con F5 (ver .vscode/launch.json en la raíz del monorepo)
// y este archivo debería mostrar subrayados de LangCorrector únicamente
// dentro de los strings — nunca en userRepository, getUserConfig, etc.

import { UserRepository } from "./user-profile.component";

const userRepository = new UserRepository();

function getUserConfig(): void {
  console.log("El usuaro no tiene permissos");
  console.log("Conexion realisada correctamente");
}

export function handleSubmit(): void {
  const name = "Ana";
  throw new Error(`El usuaro ${name} no tiene permissos`);
}

export function notifyError(): void {
  toastError("A sucedido un error durante la autentificación");
  toastSuccess("Registo guardado");
}

function toastError(_message: string): void {}
function toastSuccess(_message: string): void {}

export default {
  save: "Guardad cambios",
  delete: "Borrar elemento",
};
