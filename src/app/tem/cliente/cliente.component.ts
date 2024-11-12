import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidoService } from '../pedido.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
})
export class ClienteComponent implements OnInit {
  pizzaForm: FormGroup;
  mostrarTabla: boolean = false;
  cliDatos: any;
  total: number = 0;

  constructor(private fb: FormBuilder, private pedidoService: PedidoService, private router: Router) {
    this.pizzaForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      tamanoPizza: ['', Validators.required],
      ingredientes: this.fb.group({
        jamon: [false],
        pina: [false],
        champinones: [false],
      }),
      numPizzas: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as any;
      if (state.editMode) {
        const pedidoEnEdicion = this.pedidoService.obtenerPedidoEnEdicion();
        if (pedidoEnEdicion) {
          this.cliDatos = pedidoEnEdicion;
          this.cargarDatosEnFormulario(pedidoEnEdicion);
          this.mostrarTabla = true;
        }
      }
    }
  }

  cargarDatosEnFormulario(datos: any) {
    this.pizzaForm.patchValue({
      nombre: datos.cliente,
      direccion: datos.direccion,
      telefono: datos.telefono,
    });
    if (datos.pizzas && datos.pizzas.length > 0) {
      const pizza = datos.pizzas[0];
      this.pizzaForm.patchValue({
        tamanoPizza: pizza.tamano,
        numPizzas: pizza.numPizzas,
        ingredientes: {
          jamon: pizza.ingredientes.includes('jamon'),
          pina: pizza.ingredientes.includes('pina'),
          champinones: pizza.ingredientes.includes('champinones')
        }
      });
    }
  }

  agregarPizza() {
    if (this.pizzaForm.valid) {
      const cliActual = this.pedidoService.obtenerClienteDatos();
      const pizza = this.crearPizza();

      if (cliActual.nombre !== this.pizzaForm.value.nombre) {
        cliActual.nombre = this.pizzaForm.value.nombre;
      }

      const pizzaExistente = cliActual.pizzas.find(p => 
        p.tamano === pizza.tamano && 
        JSON.stringify(p.ingredientes) === JSON.stringify(pizza.ingredientes)
      );

      if (pizzaExistente) {
        pizzaExistente.numPizzas += pizza.numPizzas;
        pizzaExistente.subtotal += pizza.subtotal;
      } else {
        cliActual.pizzas.push(pizza);
      }

      this.pedidoService.guardarClienteDatos(cliActual);
      this.pedidoService.guardarDatos(cliActual, pizza);
      this.resetFormulario();
      this.pedidoService.actualizarDetalles(cliActual);
      this.mostrarTabla = true;

      console.log('Pizza agregada:', pizza);
      console.log('Datos del cliente actual:', cliActual);
    } else {
      alert('Por favor, complete todos los campos requeridos.');
    }
  }

  crearPizza() {
    return {
      tamano: this.pizzaForm.value.tamanoPizza,
      ingredientes: this.obtenerIngredientesSeleccionados(),
      numPizzas: this.pizzaForm.value.numPizzas,
      subtotal: this.calcularSubtotal(),
    };
  }

  obtenerIngredientesSeleccionados() {
    return Object.keys(this.pizzaForm.value.ingredientes).filter(ingrediente => this.pizzaForm.value.ingredientes[ingrediente]);
  }

  calcularSubtotal() {
    const precios: { [key: string]: number } = { 'Chica': 40, 'Mediana': 80, 'Grande': 120 };
    const tamano: 'Chica' | 'Mediana' | 'Grande' = this.pizzaForm.value.tamanoPizza;
    const numPizzas = this.pizzaForm.value.numPizzas;
    const subtotalPizza = precios[tamano] * numPizzas;
    const costoIngredientes = this.obtenerIngredientesSeleccionados().length * 10;

    return subtotalPizza + costoIngredientes;
  }

  resetFormulario() {
    this.pizzaForm.reset({
      ingredientes: { jamon: false, pina: false, champinones: false },
      numPizzas: 1,
    });
  }

  toggleIngrediente(ingrediente: string) {
    const ingredientes = this.pizzaForm.get('ingredientes');
    if (ingredientes) {
      ingredientes.patchValue({ [ingrediente]: !ingredientes.value[ingrediente] });
    }
  }

  cargarDatosDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('clienteDatos');
    if (datosGuardados) {
      this.cliDatos = JSON.parse(datosGuardados);
      console.log('Datos cargados desde localStorage:', this.cliDatos);
    }
  }

  cancelarEdicion() {
    this.cargarDatosDesdeLocalStorage();
    alert("Datos cargados. Puedes editar tu pedido.");
  }

  guardarYContinuar() {
    this.pedidoService.actualizarClienteDatos(this.cliDatos);
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['editMode']) {
        this.router.navigate(['/detalle-pedido']);
    } else {
    
        this.router.navigate(['/crear-pizza']);
    }
  }

 
  finalizarEdicion() {
    if (this.pizzaForm.valid) {
      const pizzaActualizada = this.crearPizza();
      const datosActualizados = {
        ...this.cliDatos,
        nombre: this.pizzaForm.value.nombre,
        direccion: this.pizzaForm.value.direccion,
        telefono: this.pizzaForm.value.telefono,
        pizzas: [pizzaActualizada]
      };
      
      this.pedidoService.actualizarClienteDatos(datosActualizados);
      this.pedidoService.actualizarPizza(this.cliDatos.id - 1, pizzaActualizada);
      this.pedidoService.limpiarPedidoEnEdicion();
      this.router.navigate(['/detalle-pedido']);
    } else {
      alert('Por favor, complete todos los campos requeridos.');
    }
  }
}