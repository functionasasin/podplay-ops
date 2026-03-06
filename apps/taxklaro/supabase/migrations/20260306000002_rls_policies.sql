-- RLS Policies for TaxKlaro
-- Authenticated users can create orgs (onboarding) and access their own data

-- ORGANIZATIONS
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

-- ORGANIZATION MEMBERS
CREATE POLICY "Users can insert themselves as member"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

-- ORGANIZATION INVITATIONS
CREATE POLICY "Members can view org invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

-- USER PROFILES
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- CLIENTS
CREATE POLICY "Members can view org clients"
  ON clients FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

-- COMPUTATIONS
CREATE POLICY "Members can view org computations"
  ON computations FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can create computations"
  ON computations FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update computations"
  ON computations FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete computations"
  ON computations FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Shared computations viewable by anyone with the token
CREATE POLICY "Public can view shared computations"
  ON computations FOR SELECT
  TO anon
  USING (share_enabled = true);

-- COMPUTATION NOTES
CREATE POLICY "Members can view computation notes"
  ON computation_notes FOR SELECT
  TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Members can create computation notes"
  ON computation_notes FOR INSERT
  TO authenticated
  WITH CHECK (computation_id IN (SELECT id FROM computations WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));

-- COMPUTATION DEADLINES
CREATE POLICY "Members can view deadlines"
  ON computation_deadlines FOR SELECT
  TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Members can create deadlines"
  ON computation_deadlines FOR INSERT
  TO authenticated
  WITH CHECK (computation_id IN (SELECT id FROM computations WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Members can update deadlines"
  ON computation_deadlines FOR UPDATE
  TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())));
