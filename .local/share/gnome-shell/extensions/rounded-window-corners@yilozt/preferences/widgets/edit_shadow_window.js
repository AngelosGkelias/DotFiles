// imports.gi
import Gtk      from 'gi://Gtk'
import GObject      from 'gi://GObject'

// local modules
import { box_shadow_css } from '../../utils/types.js'
import { settings } from '../../utils/settings.js'

import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import { uri } from '../../utils/io.js'
// ----------------------------------------------------------------- end imports

/**
 * Shadow edit window
 *
 * This widget used to edit shadow of windows which use rounded corners
 * effects.
 */
export const EditShadowWindow = GObject.registerClass (
  {
    Template: uri (import.meta.url, 'edit-shadow-window.ui'),
    GTypeName: 'EditShadowWindow',
    InternalChildren: [
      'opacity_scale',
      'spread_radius_scale',
      'blur_offset_scale',
      'vertical_offset_scale',
      'horizontal_offset_scale',
      'unfocus_shadow_widget',
      'focus_shadow_widget',
      'focus_toggle_button',
      'unfocus_toggle_button',
    ],
  },
  class extends Gtk.Window {
    _init () {
      super._init ({
        title: _ ('Edit Shadow for Rounded Corners Windows'),
        modal: true,
      })

      this.unfocus_provider = new Gtk.CssProvider ()
      this.focus_provider = new Gtk.CssProvider ()
      this.focused_shadow = settings ().focused_shadow
      this.unfocused_shadow = settings ().unfocused_shadow

      // Init style of preview widgets
      this._unfocus_shadow_widget
        .get_style_context ()
        .add_provider (
          this.unfocus_provider,
          Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )
      this._focus_shadow_widget
        .get_style_context ()
        .add_provider (
          this.focus_provider,
          Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )

      // Init value controls from settings
      this.update_widget ()
      this.update_style ()

      // Update values of controls when click toggle button
      this._focus_toggle_button.connect ('toggled', () => {
        this._unfocus_toggle_button.active = !this._focus_toggle_button.active
        this.update_widget ()
      })
      this._unfocus_toggle_button.connect ('toggled', () => {
        this._focus_toggle_button.active = !this._unfocus_toggle_button.active
        this.update_widget ()
      })
    }

    update_widget () {
      const shadow = this._focus_toggle_button.get_active ()
        ? this.focused_shadow
        : this.unfocused_shadow
      this._vertical_offset_scale.set_value (shadow.vertical_offset)
      this._horizontal_offset_scale.set_value (shadow.horizontal_offset)
      this._blur_offset_scale.set_value (shadow.blur_offset)
      this._spread_radius_scale.set_value (shadow.spread_radius)
      this._opacity_scale.set_value (shadow.opacity)
    }

    update_cfg () {
      const shadow = {
        vertical_offset: this._vertical_offset_scale.get_value (),
        horizontal_offset: this._horizontal_offset_scale.get_value (),
        blur_offset: this._blur_offset_scale.get_value (),
        spread_radius: this._spread_radius_scale.get_value (),
        opacity: this._opacity_scale.get_value (),
      }
      if (this._focus_toggle_button.get_active ()) {
        this.focused_shadow = shadow
      } else {
        this.unfocused_shadow = shadow
      }

      // Store into settings
      settings ().unfocused_shadow = this.unfocused_shadow
      settings ().focused_shadow = this.focused_shadow
    }

    update_style () {
      const gen_style = (normal, hover) => `label {
           background-color: white;
           transition: box-shadow 200ms;
           color: black;
           ${box_shadow_css (normal)};
         }
         label:hover {
           ${box_shadow_css (hover)};
         }`

      if (Gtk.MAJOR_VERSION >= 4 && Gtk.MINOR_VERSION >= 12) {
        this.unfocus_provider.load_from_string (
          gen_style (this.unfocused_shadow, this.focused_shadow)
        )
        this.focus_provider.load_from_string (
          gen_style (this.focused_shadow, this.unfocused_shadow)
        )
      } else {
        const funcs = this.unfocus_provider.load_from_data
        if (funcs.length == 1) {
          this.unfocus_provider.load_from_data (
            gen_style (this.unfocused_shadow, this.focused_shadow)
          )
          this.focus_provider.load_from_data (
            gen_style (this.focused_shadow, this.unfocused_shadow)
          )
        } else {
          this.unfocus_provider.load_from_data (
            gen_style (this.unfocused_shadow, this.focused_shadow),
            -1
          )
          this.focus_provider.load_from_data (
            gen_style (this.focused_shadow, this.unfocused_shadow),
            -1
          )
        }
      }
    }

    // signal handles

    on_value_changed () {
      this.update_cfg ()
      this.update_style ()
    }
  }
)
