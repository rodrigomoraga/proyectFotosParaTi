/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
//path permite trabajar con rutas y fs con el sistema de archivos
const path = require('path')
const fs = require('fs');

module.exports = {

    inicioSesion: async (peticion, respuesta) => {
      respuesta.view('pages/admin/inicio_sesion')
    },
  
    procesarInicioSesion: async (peticion, respuesta) => {
      let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena })
      if (admin && admin.activo) {
        peticion.session.admin = admin
        peticion.session.cliente = undefined
        peticion.addFlash('mensaje', 'Sesión de admin iniciada')
        return respuesta.redirect("/admin/principal")
      }
      else {
        peticion.addFlash('mensaje', 'Email o contraseña invalidos')
        return respuesta.redirect("/admin/inicio-sesion");
      }
    },
  
    principal: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let fotos = await Foto.find()
      respuesta.view('pages/admin/principal',{ fotos })
    },
  
    cerrarSesion: async (peticion, respuesta) => {
      peticion.session.admin = undefined
      peticion.addFlash('mensaje', 'Sesión finalizada')
      return respuesta.redirect("/");
    },

    agregarFoto: async (peticion, respuesta) => {
        respuesta.view('pages/admin/agregar_foto')
    },
    
    procesarAgregarFoto: async (peticion, respuesta) => {
        let foto = await Foto.create({
            titulo: peticion.body.titulo,
            activa: true
          }).fetch()
          peticion.file('foto').upload({}, async (error, archivos) => {
            if (archivos && archivos[0]) {
                //.fd indica donde se subio
              let upload_path = archivos[0].fd
              let ext = path.extname(upload_path)
      
              await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)))
              await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}` })
              peticion.addFlash('mensaje', 'Foto agregada')
              return respuesta.redirect("/admin/principal")
            }
      
            peticion.addFlash('mensaje', 'No hay foto seleccionada')
            return respuesta.redirect("/admin/agregar-foto")
      
        })
      
    
    },
    
    desactivarFoto: async (peticion, respuesta) => {
        await Foto.update({id: peticion.params.fotoId}, {activa: false})
        peticion.addFlash('mensaje', 'Foto desactivada')
        return respuesta.redirect("/admin/principal")
    },
    
    activarFoto: async (peticion, respuesta) => {
    await Foto.update({id: peticion.params.fotoId}, {activa: true})
    peticion.addFlash('mensaje', 'Foto activada')
    return respuesta.redirect("/admin/principal")
    },

    administradores: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let administradores = await Admin.find()
      let id = peticion.session.admin.id
      respuesta.view('pages/admin/administradores',{ administradores, id})
    },
    
    activarAdministrador: async (peticion, respuesta) => {
      await Admin.update({id: peticion.params.adminId}, {activa: true})
      peticion.addFlash('mensaje', 'Administrador activado')
      return respuesta.redirect("/admin/administradores")
    },
    
    desactivarAdministrador: async (peticion, respuesta) => {
      await Admin.update({id: peticion.params.adminId}, {activa: false})
      peticion.addFlash('mensaje', 'Administrador desactivado')
      return respuesta.redirect("/admin/administradores")
    },
    
    clientes: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let clientes = await Cliente.find()
      respuesta.view('pages/admin/clientes',{ clientes })
    },
    
    activarCliente: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      await Cliente.update({id: peticion.params.clienteId}, {activo: true})
      peticion.addFlash('mensaje', 'Cliente activado')
      return respuesta.redirect("/admin/clientes")
    },

    desactivarCliente: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      await Cliente.update({id: peticion.params.clienteId}, {activo: false})
      peticion.addFlash('mensaje', 'Cliente desactivado')
      return respuesta.redirect("/admin/clientes")
    },

    ordenesCliente: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let ordenes = await Orden.find({cliente : peticion.params.clienteId}).sort('id desc')
      respuesta.view('pages/admin/ordenes-cliente', {ordenes})
    },

    ordenCliente: async (peticion,respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let orden = await Orden.findOne({cliente: peticion.params.clienteId, id: peticion.params.ordenId}).populate("detalles")
      if(orden){
        orden.detalles = await OrdenDetalle.find({ orden: orden.id }).populate('foto')
        return respuesta.view('pages/admin/orden-cliente',{orden})
      }
      else{
        peticion.addFlash('mensaje', 'Esta orden no existe')
        respuesta.view('pages/admin/ordenes-cliente')
      }
    },
    
    dashboard: async (peticion, respuesta) => {
      if (!peticion.session || !peticion.session.admin){
        peticion.addFlash('mensaje', 'Sesión inválida')
        return respuesta.redirect("/admin/inicio-sesion")
      }
      let fotos = await Foto.find()
      let clientes = await Cliente.find()
      let administradores = await Admin.find()
      let ordenes = await Orden.find()

      let cantFotos = fotos.length
      let cantClientes = clientes.length
      let cantAdmin = administradores.length
      let cantOrdenes = ordenes.length

      return respuesta.view('pages/admin/dashboard',{cantFotos,cantClientes,cantAdmin,cantOrdenes})

    },
};

  
  