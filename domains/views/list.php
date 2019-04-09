<?php 
	print_r($this->domains);
?>
<table class="table table-striped">
	<tr>
		<th>Domain name</th>
		<th>Home directory</th>
		<th>Status</th>
		<th></th>
		<th></th>
	</tr>
	<% loop DomainList %>
	<tr>
		<td><a href="http://<& name &>/" target="_blank"><& name &></a></td>
		<td><& directory &></td>
		<& status &>
		<td><button class="delete btn btn-danger" type="submit" id="button" name="inDelete_<& id &>" id="inDelete_<& id &>" value="inDelete_<& id &>"><: Delete :></button></td>
	</tr>
	<% endloop %>
</table>