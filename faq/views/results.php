						<?php
							foreach($this->categories AS $category) {
								?>
									<div class="tab-pane show active" id="v-pills-<?php print $category->id; ?>" role="tabpanel" aria-labelledby="v-pills-<?php print $category->id; ?>-tab" tabindex="0">
										<?php
											foreach($category->entries AS $entry) {
												?>
													<div class="alert alert-dark" role="alert">
														<h4 class="alert-heading text-primary-emphasis"><?php print $entry->question; ?></h4>
														<div class="ps-5 pe-5"><?php print $entry->answer; ?></div>
													</div>
												<?php
											}
										?>
									</div>
								<?php
							}
						?>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>