<?php
/**
 * Plugin Name: RawEdits
 * Description: Enables post raw editing.
 * Version: 1.0
 * Author: Igor Davidov
 * Author URI: http://www.igordavidov.com/
 * License: GPLv2 or later
 * Copyright: 2013. Igor Davidov
 **/
class RawEdits
{
	public function activate()
	{
		$this->install();
	}

	public function deactivate()
	{
		$this->uninstall();
	}

	public function enqueueInit($hook_suffix)
	{
		global $post;
		$pass = true;
		$options = get_option('rawedits_options');
		if(isset($options['only_admin'])){
			if($options['only_admin'] == 1){
				if(!current_user_can('administrator')){
					$pass = false;
				}
			}
		}

		if(($hook_suffix == 'post.php' || $hook_suffix == 'post-new.php') && $pass == true){
			wp_enqueue_script('jquery');
			wp_enqueue_script('raweditswatcher-script', WP_CONTENT_URL . '/plugins/rawedits/raweditswatcher.js', array('jquery'), '1.0.0', true);
			wp_enqueue_script('raweditswatcherfs-script', WP_CONTENT_URL . '/plugins/rawedits/jquery.fullscreen-min.js', array('jquery'), '1.0.0', true);
			wp_enqueue_style('raweditswatcher-style', WP_CONTENT_URL . '/plugins/rawedits/raweditswatcher.css');
			$edittype = ($hook_suffix == 'post.php') ? 'old' : 'new';
			wp_localize_script( 'raweditswatcher-script', 'raweditswatcher', array(
				'edittype' => $edittype,
				'postid' => $post->ID,
				'isdefault' => $options['is_default'],
				'capturetype'	=> $options['capture_type'],
				'spacesnum'		=> $options['spaces_num']
			));
		}
	}

	public function getRawPost()
	{
		$ID = $_POST['postid'];
		$post = wp_get_single_post($ID, OBJECT);

		echo $post->post_content;
		die();
	}

	public function saveRawPost()
	{
		$post = array();
		$post['ID'] = $_POST['postid'];
		$post['post_content'] = $_POST['content'];
		wp_update_post($post);

		echo 'ok';
		die();
	}

	public function adminInit()
	{
		register_setting('rawedits_options', 'rawedits_options', array($this, 'adminSettingsValidate'));
	}

	public function adminSettingsValidate($input)
	{
		// validation & sanitization
		// to add error use "add_settings_error" function with proper params here
		return $input;
	}

	public function adminAddSettingsPage()
	{
		add_options_page('RawEdits Options', 'RawEdits', 'manage_options', 'rawedits_options', array($this, 'adminGetSettingsPage'));
	}

	public function adminGetSettingsPage()
	{
		?>
		<div class="wrap">
			<div id="icon-options-general" class="icon32"><br></div>
			<h2>RawEdits Options</h2>
			<form method="post" action="options.php">
				<p>
					Choose RawEdits options.
				</p>
				<!-- <h3>Subtitle</h3> -->
				<?php settings_fields('rawedits_options'); ?>
				<?php $options = get_option('rawedits_options'); ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th>Default Editor</th>
							<td>
								<input type="checkbox" value="1" id="is_default" name="rawedits_options[is_default]"<?php checked( isset( $options['is_default'] ) ); ?>>
							</td>
						</tr>
						<tr>
							<th>Capture tab as</th>
							<td>
								<fieldset>
									<label title="Do not capture">
										<input type="radio" value="1" name="rawedits_options[capture_type]"<?php checked( $options['capture_type'] == 1 ); ?>>
										<span>Do not capture</span>
									</label>
									<br>
									<label title="Tab character">
										<input type="radio" value="2" name="rawedits_options[capture_type]"<?php checked( $options['capture_type'] == 2 ); ?>>
										<span>Tab character</span>
									</label>
									<br>
									<label title="Spaces">
										<input type="radio" value="3" name="rawedits_options[capture_type]"<?php checked( $options['capture_type'] == 3 ); ?>>
										<span></span>
									</label>
									<input class="small-text" type="text" value="<?php echo $options['spaces_num']; ?>" name="rawedits_options[spaces_num]">
									<span class="example">spaces.</span>
								</fieldset>
							</td>
						</tr>
						<tr>
							<th>Only Admin can edit raw</th>
							<td>
								<input type="checkbox" value="1" id="only_admin" name="rawedits_options[only_admin]"<?php checked( isset( $options['only_admin'] ) ); ?>>
							</td>
						</tr>
					</tbody>
				</table>
				<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />
				</p>
			</form>
		</div>
		<?php
	}

	public function install()
	{
		// default options
		$options = array(
				'is_default'   			=> null,
				'capture_type'			=> 1,
				'spaces_num'			=> 2,
				'only_admin'			=> null
				);
		add_option('rawedits_options', $options);
	}

	public function uninstall()
	{
		delete_option('rawedits_options');
	}
}

// instance
$rawedits = new RawEdits();

// register activation/deactivation hooks
register_activation_hook(__file__, array($rawedits, 'activate'));
register_deactivation_hook(__file__, array($rawedits, 'deactivate'));

// add settings page
add_action('admin_menu', array($rawedits, 'adminAddSettingsPage'));

// initialize plugin
add_action('admin_init', array($rawedits, 'adminInit'));

// enqueue actions
add_action('admin_enqueue_scripts', array($rawedits, 'enqueueInit'));

// ajax actions
add_action('wp_ajax_get_raw_post', array($rawedits, 'getRawPost'));
add_action('wp_ajax_save_raw_post', array($rawedits, 'saveRawPost'));