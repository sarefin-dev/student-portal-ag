DROP POLICY "Admins and staff can view leads" ON leads;
DROP POLICY "Admins and staff can insert leads" ON leads;
DROP POLICY "Admins and staff can update leads" ON leads;
DROP POLICY "Admins and staff can delete leads" ON leads;

CREATE POLICY "Admins can view leads" ON leads FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert leads" ON leads FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update leads" ON leads FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (is_admin());
