const supabase = require("../config/supabase");

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica de entrada
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
    }

    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    // (Opcional) Verificar si es admin con metadata o base de datos
    const { user, session } = data;
    console.log(data)

    // Solo permitir si tiene un campo "is_admin" true, por ejemplo
    /* if (!user.user_metadata?.is_admin) {
      return res.status(403).json({ success: false, message: 'No autorizado.' });
    }
 */
    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      access_token: session.access_token, // Puedes guardar esto en el frontend
      user: {
        id: user.id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Error en loginAdmin:", error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {loginAdmin};