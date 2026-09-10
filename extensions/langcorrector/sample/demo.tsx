// Ejemplos de JSX de IDEA.md: label, placeholder y texto de botón.

export function LoginForm(): JSX.Element {
  return (
    <form className="login-form" data-testid="login-form">
      <label>Nombre de usuaro</label>
      <input placeholder="Introuce tu correo" aria-label="Correo electronico" />
      <button title="Cerrar sesion">Guardar cambios</button>
    </form>
  );
}
