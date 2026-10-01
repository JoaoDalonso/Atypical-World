/**
 * @fileoverview Navigation Controller
 * Orquestra a navegação, menu responsivo mobile e acordeões das seções.
 */

import { NavigationView } from '../ui/views/NavigationView.js';
import { AccordionView } from '../ui/views/AccordionView.js';

export class NavigationController {
  constructor() {
    this.navigationView = new NavigationView();
    this.accordionView = new AccordionView();
  }

  /**
   * Inicializa os módulos de visualização de navegação e acordeão.
   */
  init() {
    this.navigationView.init();
    this.accordionView.init();
  }
}
