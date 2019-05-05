<br />
<br />
<div class="container mt-4">
	<div class="row mt-4">
		<?php
			foreach($this->categories AS $category) {
				?>
					<div class="col-6">
						<h3><?php print $category->name; ?></h3>
					</div>
					<div class="col-6">
						<div class="accordion mt-4 mb-4" id="category_<?php print $category->id; ?>">
							<?php
								foreach($category->entries AS $entry) {
									?>
										<div class="card bg-transparent border-0">
											<div class="card-header bg-transparent border-0" id="entry_<?php print $entry->id; ?>">
												<h2 class="mb-0 p-0">
													<button class="btn btn-link p-0" type="button" data-toggle="collapse" data-target="#answer_<?php print $entry->id; ?>" aria-expanded="true" aria-controls="answer_<?php print $entry->id; ?>">
														<?php print $entry->question; ?>
													</button>
												</h2>
											</div>

											<div id="answer_<?php print $entry->id; ?>" class="collapse" aria-labelledby="entry_<?php print $entry->id; ?>" data-parent="#category_<?php print $category->id; ?>">
												<div class="card-body">
													<?php print $entry->answer; ?>
												</div>
											</div>
										</div>
									<?php
								}
							?>
						</div>					
					</div>
				<?php
			}
		?>
	</div>
</div>